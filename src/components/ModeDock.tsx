import { useMemo, useState } from "react";
import { GROUPS, MODES, type Mode } from "../data/modes";
import { cn } from "../utils/cn";

interface Props {
  active: string;
  onPick: (m: Mode) => void;
  sticky: boolean;
  onStickyChange: (v: boolean) => void;
}

export default function ModeDock({ active, onPick, sticky, onStickyChange }: Props) {
  const [q, setQ] = useState("");
  const [hover, setHover] = useState<Mode | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MODES;
    return MODES.filter(
      (m) =>
        m.id.includes(s) ||
        m.label.toLowerCase().includes(s) ||
        m.tagline.toLowerCase().includes(s) ||
        m.description.toLowerCase().includes(s),
    );
  }, [q]);

  const info = hover ?? MODES.find((m) => m.id === active) ?? MODES[0];

  return (
    <aside className="relative z-10 flex h-full w-[286px] shrink-0 flex-col border-r hairline bg-ink-900/60 backdrop-blur-xl">
      <div className="border-b hairline px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Turbo Brilliance
          </h2>
          <span className="rounded-full bg-liquid-400/10 px-2 py-0.5 text-[10px] font-mono text-liquid-400">
            {MODES.length} modes
          </span>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search modes & constructs…"
          className="mt-2.5 w-full rounded-lg border hairline bg-ink-950/70 px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-liquid-400/50"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" onMouseLeave={() => setHover(null)}>
        {GROUPS.map((g) => {
          const items = filtered.filter((m) => m.group === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id} className="mb-4">
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className={cn("h-px w-3 bg-gradient-to-r", g.accent)} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  {g.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((m) => {
                  const on = m.id === active;
                  return (
                    <button
                      key={m.id}
                      onMouseEnter={() => setHover(m)}
                      onClick={() => onPick(m)}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-all",
                        on
                          ? "border-liquid-400/60 bg-liquid-400/12 shadow-[0_0_18px_-6px_rgba(46,230,197,0.6)]"
                          : "hairline bg-ink-800/40 hover:border-flux-400/40 hover:bg-ink-700/60",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[11px] leading-none",
                            on ? "text-liquid-400" : "text-slate-500 group-hover:text-flux-400",
                          )}
                        >
                          {m.glyph}
                        </span>
                        <span
                          className={cn(
                            "truncate text-[11.5px] font-medium",
                            on ? "text-white" : "text-slate-300",
                          )}
                        >
                          {m.label}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[9.5px] text-slate-600">
                        {"{REASON:" + m.id + "}"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <p className="px-1 py-6 text-center text-xs text-slate-600">No mode matches “{q}”.</p>
        )}
      </div>

      <div className="border-t hairline bg-ink-950/60 p-3">
        <div className="rounded-lg border hairline bg-ink-800/50 p-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-[1px] text-sm text-liquid-400">{info.glyph}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{info.label}</p>
              <p className="text-[10.5px] text-liquid-400/80">{info.tagline}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{info.description}</p>
        </div>
        <label className="mt-2.5 flex cursor-pointer items-center justify-between rounded-lg border hairline bg-ink-800/40 px-2.5 py-2">
          <span className="text-[11px] text-slate-300">
            Pin mode to every turn
            <span className="block text-[9.5px] text-slate-600">
              off = prefix only the next message
            </span>
          </span>
          <span
            onClick={(e) => {
              e.preventDefault();
              onStickyChange(!sticky);
            }}
            className={cn(
              "relative h-[18px] w-8 shrink-0 rounded-full transition-colors",
              sticky ? "bg-liquid-500" : "bg-slate-700",
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all",
                sticky ? "left-[16px]" : "left-[2px]",
              )}
            />
          </span>
        </label>
      </div>
    </aside>
  );
}
