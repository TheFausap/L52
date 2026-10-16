import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { ChatMessage } from "../lib/llama";
import { MODE_BY_ID } from "../data/modes";
import { cn } from "../utils/cn";

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-slate-600">{k}</span>{" "}
      <span className="text-slate-400">{v}</span>
    </span>
  );
}

// Shared markdown plugins for KaTeX + GFM
const remarkPlugins: any[] = [remarkGfm, remarkMath];
const rehypePlugins: any[] = [rehypeKatex];

export default function MessageView({
  m,
  streaming,
}: {
  m: ChatMessage;
  streaming: boolean;
}) {
  const [openThink, setOpenThink] = useState(false);
  const mode = m.mode ? MODE_BY_ID[m.mode] : undefined;

  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%]">
          {mode && (
            <div className="mb-1 flex justify-end">
              <span className="rounded-md bg-flux-500/15 px-1.5 py-0.5 font-mono text-[10px] text-flux-400">
                {"{REASON:" + mode.id + "}"}
              </span>
            </div>
          )}
          <div className="rounded-2xl rounded-tr-sm border border-flux-500/25 bg-flux-500/10 px-4 py-2.5 text-[0.9rem] leading-relaxed whitespace-pre-wrap text-slate-100">
            {m.content}
          </div>
        </div>
      </div>
    );
  }

  const thinking = streaming && !!m.reasoning && !m.content;

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[12px]",
          m.error
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
            : "border-liquid-400/40 bg-liquid-400/10 text-liquid-400",
        )}
      >
        {m.error ? "!" : (mode?.glyph ?? "◈")}
      </div>
      <div className="min-w-0 flex-1">
        {mode && !m.error && (
          <div className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-slate-500">
            {mode.label} · <span className="text-slate-600">{mode.tagline}</span>
          </div>
        )}

        {m.reasoning && (
          <div className="mb-2 overflow-hidden rounded-xl border hairline bg-ink-850/60">
            <button
              onClick={() => setOpenThink((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-ink-700/40"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  thinking ? "live-dot bg-liquid-400" : "bg-plasma-400",
                )}
              />
              <span className="text-[11px] font-medium text-slate-300">
                {thinking ? "Thinking…" : "Reasoning trace"}
              </span>
              <span className="font-mono text-[10px] text-slate-600">
                {m.reasoning.length.toLocaleString()} chars
              </span>
              <span className="ml-auto text-[10px] text-slate-500">
                {openThink ? "hide ▴" : "show ▾"}
              </span>
            </button>
            {(openThink || thinking) && (
              <div className="max-h-72 overflow-y-auto border-t hairline bg-ink-950/50 px-3 py-2.5">
                <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-slate-500">
                  {m.reasoning}
                  {thinking && <span className="caret" />}
                </p>
              </div>
            )}
          </div>
        )}

        {m.content && (
          <div className={cn("md katex-wrap", m.error && "text-rose-300")}>
            <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
              {m.content}
            </ReactMarkdown>
          </div>
        )}
        {streaming && m.content && <span className="caret" />}

        {m.stats && (
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t hairline pt-1.5 font-mono text-[10px]">
            <Stat
              k="gen"
              v={`${(m.stats.predicted_per_second ?? 0).toFixed(1)} t/s`}
            />
            {m.stats.prompt_per_second != null && (
              <Stat k="prefill" v={`${m.stats.prompt_per_second.toFixed(0)} t/s`} />
            )}
            <Stat k="tokens" v={`${m.stats.predicted_n ?? 0}`} />
            {m.stats.ttftMs != null && (
              <Stat k="ttft" v={`${(m.stats.ttftMs / 1000).toFixed(2)}s`} />
            )}
            {m.stats.totalMs != null && (
              <Stat k="wall" v={`${(m.stats.totalMs / 1000).toFixed(1)}s`} />
            )}
            <Stat k="experts" v="4 / 64" />
          </div>
        )}
      </div>
    </div>
  );
}
