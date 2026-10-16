export interface ServerSettings {
  baseUrl: string;
  apiKey: string;
}

export interface SamplerSettings {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  repeat_penalty: number;
  max_tokens: number;
  presence_penalty: number;
  seed: number;
}

export const DEFAULT_SAMPLER: SamplerSettings = {
  temperature: 0.6,
  top_p: 0.95,
  top_k: 64,
  min_p: 0.05,
  repeat_penalty: 1.03,
  max_tokens: 4096,
  presence_penalty: 0,
  seed: -1,
};

export const SAMPLER_PRESETS: Record<string, { label: string; hint: string; v: Partial<SamplerSettings> }> = {
  tested: {
    label: "As Tested",
    hint: "Temp 1 · rep-pen off · topK 64 · topP .95 · minP .05",
    v: { temperature: 1.0, repeat_penalty: 1.0, top_k: 64, top_p: 0.95, min_p: 0.05 },
  },
  suggested: {
    label: "Suggested",
    hint: "Temp .5–.7 · rep-pen 1–1.05 — daily driver",
    v: { temperature: 0.6, repeat_penalty: 1.03, top_k: 64, top_p: 0.95, min_p: 0.05 },
  },
  tools: {
    label: "Tools / Agent",
    hint: "Temp .6–.7, tight sampling for function calling",
    v: { temperature: 0.65, repeat_penalty: 1.0, top_k: 50, top_p: 0.95, min_p: 0.02 },
  },
  creative: {
    label: "Creative",
    hint: "Story, comedy, holodeck, constructs",
    v: { temperature: 0.95, repeat_penalty: 1.05, top_k: 100, top_p: 0.95, min_p: 0.03 },
  },
  precise: {
    label: "Precise",
    hint: "Math, code review, extraction",
    v: { temperature: 0.3, repeat_penalty: 1.0, top_k: 40, top_p: 0.9, min_p: 0.05 },
  },
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  mode?: string;
  stats?: GenStats;
  error?: boolean;
}

export interface GenStats {
  predicted_n?: number;
  predicted_per_second?: number;
  prompt_n?: number;
  prompt_per_second?: number;
  ttftMs?: number;
  totalMs?: number;
  thinkMs?: number;
}

export interface ServerProps {
  model?: string;
  n_ctx?: number;
  chatTemplate?: string;
  buildInfo?: string;
}

function headers(s: ServerSettings): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (s.apiKey.trim()) h["Authorization"] = `Bearer ${s.apiKey.trim()}`;
  return h;
}

export const trimUrl = (u: string) => u.replace(/\/+$/, "");

export async function fetchProps(s: ServerSettings): Promise<ServerProps> {
  const r = await fetch(`${trimUrl(s.baseUrl)}/props`, { headers: headers(s) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const gs = j.default_generation_settings ?? {};
  return {
    model: (j.model_path ?? gs.model ?? "unknown").split(/[\\/]/).pop(),
    n_ctx: gs.n_ctx ?? j.n_ctx,
    chatTemplate: j.chat_template ? String(j.chat_template).slice(0, 400) : undefined,
    buildInfo: j.build_info,
  };
}

export interface StreamHandlers {
  onReasoning: (delta: string) => void;
  onContent: (delta: string) => void;
  onStats: (s: GenStats) => void;
}

/**
 * Streams an OpenAI-compatible completion from llama-server.
 * Handles both `reasoning_content` deltas and inline <think> tags.
 */
export async function streamChat(
  server: ServerSettings,
  body: Record<string, unknown>,
  signal: AbortSignal,
  h: StreamHandlers,
): Promise<void> {
  const started = performance.now();
  let ttft: number | undefined;

  const res = await fetch(`${trimUrl(server.baseUrl)}/v1/chat/completions`, {
    method: "POST",
    headers: headers(server),
    signal,
    body: JSON.stringify({ ...body, stream: true, timings_per_token: true }),
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`llama-server ${res.status}: ${txt.slice(0, 300) || res.statusText}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let inThink = false;
  let pending = "";
  let predicted = 0;
  let timings: any = null;

  const route = (raw: string) => {
    // split inline <think> blocks out of the content stream
    pending += raw;
    while (pending.length) {
      if (!inThink) {
        const i = pending.indexOf("<think>");
        if (i === -1) {
          const keep = Math.max(0, pending.length - 7);
          if (keep > 0) h.onContent(pending.slice(0, keep));
          pending = pending.slice(keep);
          return;
        }
        if (i > 0) h.onContent(pending.slice(0, i));
        pending = pending.slice(i + 7);
        inThink = true;
      } else {
        const j = pending.indexOf("</think>");
        if (j === -1) {
          const keep = Math.max(0, pending.length - 8);
          if (keep > 0) h.onReasoning(pending.slice(0, keep));
          pending = pending.slice(keep);
          return;
        }
        if (j > 0) h.onReasoning(pending.slice(0, j));
        pending = pending.slice(j + 8);
        inThink = false;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") continue;
      let j: any;
      try {
        j = JSON.parse(payload);
      } catch {
        continue;
      }
      if (j.timings) timings = j.timings;
      const d = j.choices?.[0]?.delta ?? {};
      if (ttft === undefined && (d.content || d.reasoning_content)) ttft = performance.now() - started;
      if (d.reasoning_content) {
        predicted++;
        h.onReasoning(d.reasoning_content);
      }
      if (typeof d.content === "string" && d.content.length) {
        predicted++;
        route(d.content);
      }
    }
  }
  if (pending) (inThink ? h.onReasoning : h.onContent)(pending);

  const totalMs = performance.now() - started;
  h.onStats({
    predicted_n: timings?.predicted_n ?? predicted,
    predicted_per_second:
      timings?.predicted_per_second ?? (predicted / Math.max(1, totalMs - (ttft ?? 0))) * 1000,
    prompt_n: timings?.prompt_n,
    prompt_per_second: timings?.prompt_per_second,
    ttftMs: ttft,
    totalMs,
  });
}

export async function tokenize(s: ServerSettings, content: string): Promise<number> {
  const r = await fetch(`${trimUrl(s.baseUrl)}/tokenize`, {
    method: "POST",
    headers: headers(s),
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error("tokenize failed");
  const j = await r.json();
  return (j.tokens ?? []).length;
}
