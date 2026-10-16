import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ModeDock from "./components/ModeDock";
import Inspector from "./components/Inspector";
import MessageView from "./components/MessageView";
import { MODE_BY_ID, type Mode } from "./data/modes";
import {
  DEFAULT_SAMPLER,
  fetchProps,
  streamChat,
  type ChatMessage,
  type SamplerSettings,
  type ServerProps,
  type ServerSettings,
} from "./lib/llama";
import { cn } from "./utils/cn";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const LS = "lfm25-tb-ui";
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_SYSTEM = "You are a helpful assistant trained by Liquid AI.";

const MATH_SNIPPETS: { label: string; insert: string; hint: string }[] = [
  { label: "$x$", insert: "$x^2 + y^2 = r^2$", hint: "inline math" },
  { label: "$$ block", insert: "\n$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n", hint: "display block" },
  { label: "∑ frac", insert: "$\\displaystyle \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$", hint: "series" },
  { label: "matrix", insert: "\n$$\n\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\n$$\n", hint: "matrix" },
  { label: "align*", insert: "\n$$\n\\begin{aligned} E &= mc^2 \\\\ F &= ma \\end{aligned}\n$$\n", hint: "aligned" },
];

const STARTERS: { mode: string; text: string }[] = [
  { mode: "help", text: "Show me the detailed help menu." },
  { mode: "logic", text: "Solve $\\int_0^1 x^n dx$ and prove $\\sum_{k=1}^n k = n(n+1)/2$. Use LaTeX with $...$ and $$...$$." },
  { mode: "business", text: "I need a business plan to open a food truck in Las Vegas. Include charts and tables." },
  { mode: "coder", text: "Write a Python function that computes the softmax with numerical stability. Document the math: $\\mathrm{softmax}(z_i)=\\frac{e^{z_i}}{\\sum_j e^{z_j}}$." },
  { mode: "deeptree", text: "Design a fault-tolerant job queue in Go. Compare three architectures." },
  { mode: "house", text: "34F, intermittent fever, joint pain, normal CBC. Differential?" },
  { mode: "holodeck", text: "Should a city ban private cars from its downtown core?" },
  { mode: "pkd", text: "Hello Phillip..." },
];

interface Persisted {
  server: ServerSettings;
  sampler: SamplerSettings;
  system: string;
  mode: string;
  sticky: boolean;
}

function load(): Partial<Persisted> {
  try {
    return JSON.parse(localStorage.getItem(LS) ?? "{}");
  } catch {
    return {};
  }
}

export default function App() {
  const saved = useMemo(load, []);
  const [server, setServer] = useState<ServerSettings>(
    saved.server ?? { baseUrl: "http://localhost:8080", apiKey: "" },
  );
  const [sampler, setSampler] = useState<SamplerSettings>({
    ...DEFAULT_SAMPLER,
    ...(saved.sampler ?? {}),
  });
  const [systemPrompt, setSystemPrompt] = useState(saved.system ?? DEFAULT_SYSTEM);
  const [mode, setMode] = useState(saved.mode ?? "high");
  const [sticky, setSticky] = useState(saved.sticky ?? true);

  const [props, setProps] = useState<ServerProps | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error" | "checking">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(
      LS,
      JSON.stringify({ server, sampler, system: systemPrompt, mode, sticky }),
    );
  }, [server, sampler, systemPrompt, mode, sticky]);

  const check = useCallback(async () => {
    setStatus("checking");
    setStatusMsg(`probing ${server.baseUrl}/props …`);
    try {
      const p = await fetchProps(server);
      setProps(p);
      setStatus("ok");
      setStatusMsg(`online · ${p.model ?? "model loaded"}`);
    } catch (e: any) {
      setProps(null);
      setStatus("error");
      setStatusMsg(
        `${e?.message ?? "unreachable"} — is llama-server running with CORS enabled?`,
      );
    }
  }, [server]);

  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const charCount = useMemo(
    () =>
      messages.reduce((n, m) => n + m.content.length + (m.reasoning?.length ?? 0), 0) +
      systemPrompt.length +
      input.length,
    [messages, systemPrompt, input],
  );
  const ctxMax = props?.n_ctx ?? 65536;
  const ctxUsed = Math.round(charCount / 3.6);
  const ctxPct = Math.min(100, (ctxUsed / ctxMax) * 100);

  const activeMode = MODE_BY_ID[mode];

  function pickMode(m: Mode) {
    setMode(m.id);
    if (m.temp != null) setSampler((s) => ({ ...s, temperature: m.temp! }));
    taRef.current?.focus();
  }

  async function send(raw?: string, replaceFrom?: number) {
    const text = (raw ?? input).trim();
    if (!text || busy) return;

    const useMode = mode !== "off";
    const prefixed = useMode ? `{REASON:${mode}} ${text}` : text;

    const base = replaceFrom != null ? messages.slice(0, replaceFrom) : messages;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      mode: useMode ? mode : undefined,
    };
    const asstId = uid();
    const asst: ChatMessage = {
      id: asstId,
      role: "assistant",
      content: "",
      reasoning: "",
      mode: useMode ? mode : undefined,
    };
    const next = [...base, userMsg, asst];
    setMessages(next);
    setInput("");
    setBusy(true);

    const history = [
      ...(systemPrompt.trim()
        ? [{ role: "system" as const, content: systemPrompt.trim() }]
        : []),
      ...base
        .filter((m) => !m.error && (m.content || m.role === "user"))
        .map((m) => ({
          role: m.role,
          content:
            m.role === "user" && m.mode ? `{REASON:${m.mode}} ${m.content}` : m.content,
        })),
      { role: "user" as const, content: prefixed },
    ];

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((cur) => cur.map((m) => (m.id === asstId ? fn(m) : m)));

    try {
      await streamChat(
        server,
        {
          model: props?.model ?? "LFM2.5-24B-A2B",
          messages: history,
          temperature: sampler.temperature,
          top_p: sampler.top_p,
          top_k: sampler.top_k,
          min_p: sampler.min_p,
          repeat_penalty: sampler.repeat_penalty,
          presence_penalty: sampler.presence_penalty,
          max_tokens: sampler.max_tokens,
          ...(sampler.seed >= 0 ? { seed: sampler.seed } : {}),
        },
        ctrl.signal,
        {
          onReasoning: (d) => patch((m) => ({ ...m, reasoning: (m.reasoning ?? "") + d })),
          onContent: (d) => patch((m) => ({ ...m, content: m.content + d })),
          onStats: (s) => patch((m) => ({ ...m, stats: s })),
        },
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        patch((m) => ({
          ...m,
          error: true,
          content:
            (m.content ? m.content + "\n\n---\n\n" : "") +
            `**Generation failed.** ${e?.message ?? e}\n\nCheck that llama-server is reachable at \`${server.baseUrl}\` and was started with \`--jinja\`.`,
        }));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
      if (!sticky) setMode("high");
    }
  }

  function stop() {
    abortRef.current?.abort();
    setBusy(false);
  }

  function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const idx = messages.indexOf(lastUser);
    void send(lastUser.content, idx);
  }

  const insertSnippet = (snippet: string) => {
    const el = taRef.current;
    if (!el) { setInput((p) => p + snippet); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + snippet + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <div className="liquid-bg flex h-screen w-screen overflow-hidden bg-ink-950">
      <ModeDock active={mode} onPick={pickMode} sticky={sticky} onStickyChange={setSticky} />

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex items-center gap-4 border-b hairline bg-ink-900/50 px-5 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-liquid-400 via-flux-500 to-plasma-400 text-[13px] font-bold text-ink-950">
              ƛ
            </div>
            <div className="leading-tight">
              <h1 className="text-[13px] font-semibold tracking-tight text-white">
                LFM2.5-24B-A2B{" "}
                <span className="bg-gradient-to-r from-liquid-400 to-plasma-400 bg-clip-text text-transparent">
                  Turbo-Brilliance-50X
                </span>
              </h1>
              <p className="font-mono text-[10px] text-slate-500">
                NEO MAX Imatrix GGUF · MoE 4/64 experts · llama-server
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="w-44">
              <div className="flex justify-between font-mono text-[9.5px] text-slate-500">
                <span>context</span>
                <span className={cn(ctxPct > 85 && "text-amber-400")}>
                  ~{ctxUsed.toLocaleString()} / {(ctxMax / 1024).toFixed(0)}K
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-flux-500 via-liquid-400 to-plasma-400 transition-all"
                  style={{ width: `${ctxPct}%` }}
                />
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px]",
                status === "ok"
                  ? "border-liquid-400/30 bg-liquid-400/10 text-liquid-400"
                  : status === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "hairline text-slate-500",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "ok"
                    ? "bg-liquid-400 live-dot"
                    : status === "error"
                      ? "bg-rose-500"
                      : "bg-slate-600",
                )}
              />
              {status === "ok" ? "connected" : status === "checking" ? "connecting" : "offline"}
            </div>
            <button
              onClick={() => setMessages([])}
              className="rounded-lg border hairline px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
            >
              new chat
            </button>
          </div>
        </header>

        {/* transcript */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-7">
            {messages.length === 0 ? (
              <div className="pt-6">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Fire the espresso into the neo-cortex.
                </h2>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-400">
                  34 reasoning modes and AI constructs are injected{" "}
                  <em className="text-slate-300">before</em> the model starts thinking. Pick one on
                  the left — it becomes a <code className="font-mono text-liquid-400">{"{REASON:…}"}</code>{" "}
                  prefix on your prompt, exactly as the model card specifies.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  {STARTERS.map((s) => {
                    const m = MODE_BY_ID[s.mode];
                    return (
                      <button
                        key={s.text}
                        onClick={() => {
                          pickMode(m);
                          void send(s.text);
                        }}
                        className="group rounded-xl border hairline bg-ink-800/40 p-3 text-left transition-all hover:border-liquid-400/40 hover:bg-ink-700/50"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-liquid-400">
                          <span>{m.glyph}</span>
                          <span>{"{REASON:" + m.id + "}"}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-300 group-hover:text-white">
                          {s.text}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10.5px]">
                  {[
                    ["2B / 24B", "active params"],
                    ["131,072", "max context"],
                    ["350+ t/s", "Q6 on a 5090"],
                  ].map(([a, b]) => (
                    <div key={b} className="rounded-xl border hairline bg-ink-900/50 p-3">
                      <p className="text-base font-semibold text-white">{a}</p>
                      <p className="text-slate-600">{b}</p>
                    </div>
                  ))}
                </div>

                {/* Math demo — live rendered, proves KaTeX is active */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-liquid-400/20 bg-ink-900/50">
                  <div className="flex items-center justify-between border-b hairline bg-ink-800/40 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-liquid-400/15 text-[11px] text-liquid-400">∑</span>
                      <div>
                        <p className="text-xs font-semibold text-white">Math rendering — KaTeX live</p>
                        <p className="font-mono text-[10px] text-slate-500">inline  <code className="text-liquid-400">$...$</code>  ·  display  <code className="text-liquid-400">$$...$$</code>  ·  copy-paste any snippet below</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-liquid-400 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-950">LaTeX ✓</span>
                  </div>
                  <div className="p-4">
                    <div className="md katex-wrap text-[13px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`Inline: Euler's identity $e^{i\\pi}+1=0$ and $\\nabla\\cdot\\mathbf{E}=\\rho/\\varepsilon_0$.

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad\\text{and}\\qquad \\sum_{n=1}^{\\infty}\\frac{1}{n^2}=\\frac{\\pi^2}{6}$$

Try $\\mathrm{softmax}(z_i)=\\frac{e^{z_i}}{\\sum_j e^{z_j}}$ inline, or a matrix:

$$\\mathbf{A}=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix},\\quad \\det(\\mathbf{A})=ad-bc$$`}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {MATH_SNIPPETS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => insertSnippet(s.insert)}
                          title={s.hint}
                          className="rounded-full border hairline bg-ink-800/60 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-liquid-400/40 hover:text-liquid-400"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-slate-600">Tip: the model already emits LaTeX with <code className="text-slate-400">$…$</code> and <code className="text-slate-400">$$…$$</code>. These buttons just help you prompt it.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <MessageView
                    key={m.id}
                    m={m}
                    streaming={busy && i === messages.length - 1 && m.role === "assistant"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="border-t hairline bg-ink-900/60 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-3xl px-6 py-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10.5px]",
                  mode === "off"
                    ? "hairline text-slate-500"
                    : "border-liquid-400/40 bg-liquid-400/10 text-liquid-400",
                )}
              >
                <span>{activeMode.glyph}</span>
                {mode === "off" ? "no injection" : `{REASON:${mode}}`}
              </span>
              <span className="truncate text-[10.5px] text-slate-600">{activeMode.tagline}</span>
              <span className="ml-auto font-mono text-[10px] text-slate-600">
                temp {sampler.temperature} · topK {sampler.top_k} · topP {sampler.top_p} · rep{" "}
                {sampler.repeat_penalty}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {MATH_SNIPPETS.map((s) => (
                <button key={"c-"+s.label} onClick={() => insertSnippet(s.insert)} className="rounded-md border hairline bg-ink-800/40 px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:border-liquid-400/40 hover:text-liquid-400" title={`Insert ${s.hint} — ${s.insert.trim().slice(0,40)}`}>
                  {s.label}
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] text-slate-600">math via KaTeX · $…$ inline · $$…$$ display</span>
            </div>

            <div className="relative rounded-2xl border hairline bg-ink-950/70 focus-within:border-liquid-400/40">
              <textarea
                ref={taRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={`Message ${activeMode.label}…  (Shift+Enter for newline)`}
                className="max-h-56 w-full resize-y bg-transparent px-4 py-3 pr-28 text-[13px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-600"
              />
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                {messages.length > 0 && !busy && (
                  <button
                    onClick={regenerate}
                    title="Regenerate last turn"
                    className="rounded-lg border hairline px-2 py-1.5 text-[11px] text-slate-400 hover:border-flux-400/50 hover:text-flux-400"
                  >
                    ↻
                  </button>
                )}
                {busy ? (
                  <button
                    onClick={stop}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11.5px] font-medium text-rose-300 hover:bg-rose-500/20"
                  >
                    stop
                  </button>
                ) : (
                  <button
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    className="rounded-lg bg-gradient-to-r from-liquid-500 to-flux-500 px-3.5 py-1.5 text-[11.5px] font-semibold text-ink-950 transition-opacity disabled:opacity-30"
                  >
                    send ↵
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600">
              Prompt is sent as{" "}
              <code className="font-mono text-slate-500">
                {mode === "off" ? "your text" : `{REASON:${mode}} your text`}
              </code>{" "}
              to <code className="font-mono text-slate-500">{server.baseUrl}/v1/chat/completions</code>
              {sticky ? " · mode pinned" : " · mode resets after this turn"}
            </p>
          </div>
        </div>
      </main>

      <Inspector
        server={server}
        setServer={setServer}
        props={props}
        status={status}
        statusMsg={statusMsg}
        onCheck={() => void check()}
        sampler={sampler}
        setSampler={setSampler}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
      />
    </div>
  );
}
