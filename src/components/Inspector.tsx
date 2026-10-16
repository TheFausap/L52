import { useState } from "react";
import {
  SAMPLER_PRESETS,
  type SamplerSettings,
  type ServerProps,
  type ServerSettings,
} from "../lib/llama";
import { BENCHMARKS, QUANTS } from "../data/modes";
import { cn } from "../utils/cn";

type Tab = "server" | "sampling" | "model";

interface Props {
  server: ServerSettings;
  setServer: (s: ServerSettings) => void;
  props: ServerProps | null;
  status: "idle" | "ok" | "error" | "checking";
  statusMsg: string;
  onCheck: () => void;
  sampler: SamplerSettings;
  setSampler: (s: SamplerSettings) => void;
  systemPrompt: string;
  setSystemPrompt: (s: string) => void;
}

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div className="mb-3.5">
      <div className="flex items-baseline justify-between">
        <label className="text-[11.5px] font-medium text-slate-300">{label}</label>
        <span className="font-mono text-[11px] text-liquid-400">{value}</span>
      </div>
      <input
        type="range"
        className="mt-1.5 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

export default function Inspector({
  server,
  setServer,
  props,
  status,
  statusMsg,
  onCheck,
  sampler,
  setSampler,
  systemPrompt,
  setSystemPrompt,
}: Props) {
  const [tab, setTab] = useState<Tab>("server");
  const set = (k: keyof SamplerSettings, v: number) => setSampler({ ...sampler, [k]: v });

  const dot =
    status === "ok"
      ? "bg-liquid-400"
      : status === "error"
        ? "bg-rose-500"
        : status === "checking"
          ? "bg-amber-400"
          : "bg-slate-600";

  return (
    <aside className="relative z-10 flex h-full w-[330px] shrink-0 flex-col border-l hairline bg-ink-900/60 backdrop-blur-xl">
      <div className="flex gap-1 border-b hairline px-3 py-2">
        {(["server", "sampling", "model"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium capitalize transition-colors",
              tab === t
                ? "bg-liquid-400/12 text-liquid-400"
                : "text-slate-500 hover:bg-ink-700/50 hover:text-slate-300",
            )}
          >
            {t === "model" ? "model card" : t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {tab === "server" && (
          <div>
            <div className="mb-3 rounded-xl border hairline bg-ink-800/50 p-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", dot, status === "ok" && "live-dot")} />
                <span className="text-xs font-semibold text-white">llama-server</span>
                <button
                  onClick={onCheck}
                  className="ml-auto rounded-md border hairline px-2 py-0.5 text-[10px] text-slate-300 hover:border-liquid-400/50 hover:text-liquid-400"
                >
                  {status === "checking" ? "checking…" : "reconnect"}
                </button>
              </div>
              <p
                className={cn(
                  "mt-1.5 font-mono text-[10.5px] break-words",
                  status === "error" ? "text-rose-400" : "text-slate-500",
                )}
              >
                {statusMsg || "not connected"}
              </p>
              {props && (
                <dl className="mt-2.5 space-y-1 border-t hairline pt-2 font-mono text-[10.5px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600">model</dt>
                    <dd className="truncate text-right text-slate-300">{props.model}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">n_ctx</dt>
                    <dd className="text-slate-300">{props.n_ctx?.toLocaleString() ?? "—"}</dd>
                  </div>
                  {props.buildInfo && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">build</dt>
                      <dd className="truncate text-right text-slate-300">{props.buildInfo}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            <label className="mb-1 block text-[11px] font-medium text-slate-300">Base URL</label>
            <input
              value={server.baseUrl}
              onChange={(e) => setServer({ ...server, baseUrl: e.target.value })}
              className="w-full rounded-lg border hairline bg-ink-950/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-200 outline-none focus:border-liquid-400/50"
            />
            <label className="mt-3 mb-1 block text-[11px] font-medium text-slate-300">
              API key <span className="text-slate-600">(optional)</span>
            </label>
            <input
              type="password"
              value={server.apiKey}
              placeholder="--api-key value"
              onChange={(e) => setServer({ ...server, apiKey: e.target.value })}
              className="w-full rounded-lg border hairline bg-ink-950/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-200 outline-none placeholder:text-slate-700 focus:border-liquid-400/50"
            />

            <label className="mt-3 mb-1 block text-[11px] font-medium text-slate-300">
              System prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border hairline bg-ink-950/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-200 outline-none focus:border-liquid-400/50"
            />
            <p className="mt-1 text-[10px] text-slate-600">
              Turbo Brilliance is switched in-prompt, so the system prompt can stay minimal.
            </p>

            <div className="mt-4 rounded-xl border hairline bg-ink-950/60 p-3">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-300">Launch command</p>
              <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed text-liquid-400/90">
{`llama-server \\
  -m LFM2.5-24B-A2B-Turbo-Brilliance\\
-50X-D_AU-Q6_k-MAX-imat.gguf \\
  -c 65536 -ngl 99 --jinja \\
  --host 0.0.0.0 --port 8080`}
              </pre>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                <code className="text-slate-400">--jinja</code> is required for the LFM2.5 ChatML
                template and Pythonic tool calls. Serve with CORS reachable from this page.
              </p>
            </div>
          </div>
        )}

        {tab === "sampling" && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Presets
            </p>
            <div className="mb-4 grid grid-cols-2 gap-1.5">
              {Object.entries(SAMPLER_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  title={p.hint}
                  onClick={() => setSampler({ ...sampler, ...p.v })}
                  className="rounded-lg border hairline bg-ink-800/50 px-2 py-1.5 text-left text-[11px] text-slate-300 transition-colors hover:border-liquid-400/50 hover:text-liquid-400"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Row
              label="Temperature"
              value={sampler.temperature}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => set("temperature", v)}
              hint="Tested at 1.0 · suggested 0.5–0.7 · tools 0.6–0.7"
            />
            <Row label="Top-P" value={sampler.top_p} min={0.1} max={1} step={0.01} onChange={(v) => set("top_p", v)} />
            <Row label="Top-K" value={sampler.top_k} min={1} max={200} step={1} onChange={(v) => set("top_k", v)} />
            <Row label="Min-P" value={sampler.min_p} min={0} max={0.3} step={0.01} onChange={(v) => set("min_p", v)} />
            <Row
              label="Repeat penalty"
              value={sampler.repeat_penalty}
              min={1}
              max={1.2}
              step={0.01}
              onChange={(v) => set("repeat_penalty", v)}
              hint="1.0 = off (as tested). 1.0–1.05 suggested."
            />
            <Row
              label="Max new tokens"
              value={sampler.max_tokens}
              min={256}
              max={32768}
              step={256}
              onChange={(v) => set("max_tokens", v)}
              hint="Deep frameworks (omni / deeptree / xultra) need headroom."
            />

            <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
              <p className="text-[11px] font-semibold text-amber-300">Context guidance</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
                Max 128K. Minimum 32,000 when Turbo Brilliance is active — 64K–128K is better. The
                construct prefix alone can consume 2,000–4,000 tokens before your prompt is read.
              </p>
            </div>
          </div>
        )}

        {tab === "model" && (
          <div className="space-y-4">
            <div className="rounded-xl border hairline bg-ink-800/50 p-3">
              <p className="text-xs font-semibold text-white">LFM2.5-24B-A2B</p>
              <p className="text-[10.5px] text-liquid-400/80">
                Turbo-Brilliance-50X · NEO MAX Imatrix
              </p>
              <dl className="mt-2.5 space-y-1.5 font-mono text-[10.5px]">
                {[
                  ["architecture", "MoE · sparse"],
                  ["experts", "4 of 64 active"],
                  ["active params", "2B of 24B"],
                  ["context", "131,072 tokens"],
                  ["reasoning", "always-on <think>"],
                  ["base", "LiquidAI/LFM2.5-24B-A2B"],
                  ["license", "lfm1.0"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="text-right text-slate-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                Quants
              </p>
              <div className="space-y-1.5">
                {QUANTS.map((q) => (
                  <div key={q.name} className="rounded-lg border hairline bg-ink-800/40 p-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[11px] text-slate-200">{q.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{q.size}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-flux-500 to-liquid-400"
                        style={{ width: `${(q.tier / 3) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">{q.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                Benchmarks (base model)
              </p>
              <div className="space-y-2">
                {BENCHMARKS.map((b) => {
                  const win = b.lfm >= b.best;
                  return (
                    <div key={b.name}>
                      <div className="flex items-baseline justify-between text-[10.5px]">
                        <span className={cn(win ? "text-slate-200" : "text-slate-400")}>
                          {b.name}
                        </span>
                        <span
                          className={cn(
                            "font-mono",
                            win ? "text-liquid-400" : "text-slate-400",
                          )}
                        >
                          {b.lfm.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            win
                              ? "bg-gradient-to-r from-liquid-500 to-liquid-400"
                              : "bg-slate-600",
                          )}
                          style={{ width: `${b.lfm}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[9.5px] text-slate-600">
                        best rival {b.rival.toFixed(2)} · {b.rivalName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
