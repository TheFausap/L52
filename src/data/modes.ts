export type ModeGroup =
  | "frameworks"
  | "effort"
  | "constructs"
  | "super"
  | "system";

export interface Mode {
  id: string;
  label: string;
  group: ModeGroup;
  glyph: string;
  tagline: string;
  description: string;
  /** suggested sampler nudge */
  temp?: number;
}

export const GROUPS: { id: ModeGroup; name: string; blurb: string; accent: string }[] = [
  {
    id: "frameworks",
    name: "Reasoning Frameworks",
    blurb: "Structural thought engines injected before the model reasons.",
    accent: "from-cyan-400 to-sky-500",
  },
  {
    id: "effort",
    name: "Effort Levels",
    blurb: "Raw thinking depth / token budget dial.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    id: "super",
    name: "Super AI Constructs",
    blurb: "Domain-engineered consciousnesses (2–4K tokens each).",
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "constructs",
    name: "AI Constructs",
    blurb: "Character-grade neural patterns in 27 dimensions.",
    accent: "from-fuchsia-400 to-violet-500",
  },
  {
    id: "system",
    name: "System",
    blurb: "Interactive in-model help.",
    accent: "from-slate-300 to-slate-500",
  },
];

export const MODES: Mode[] = [
  // --- frameworks
  {
    id: "omni",
    label: "Omni",
    group: "frameworks",
    glyph: "◈",
    tagline: "Omni-Dimensional Quantum Framework v5.0",
    description:
      "The heaviest framework in the stack. Expands the problem across parallel dimensions of analysis, cross-validates them, then collapses to a single high-confidence answer. Use for hard, open-ended or multi-constraint problems. Expect long thinking blocks.",
    temp: 0.6,
  },
  {
    id: "deeptree",
    label: "Deep Tree",
    group: "frameworks",
    glyph: "⑂",
    tagline: "Deep Tree-of-Thought Hyper-Matrix v4.0",
    description:
      "Branch, score, prune, recurse. Builds an explicit tree of candidate solutions with evaluation at every node. Best for planning, debugging and decisions with trade-offs.",
    temp: 0.6,
  },
  {
    id: "hyper",
    label: "Hyper",
    group: "frameworks",
    glyph: "▦",
    tagline: "MECE Hyper-Structure Deconstructor v3.0",
    description:
      "Mutually-exclusive / collectively-exhaustive decomposition. Shreds a prompt into non-overlapping components and rebuilds a complete structured answer. Great for specs, audits and reports.",
    temp: 0.55,
  },
  {
    id: "socrates",
    label: "Socrates",
    group: "frameworks",
    glyph: "?",
    tagline: "Socratic questioning",
    description:
      "Interrogates the premise before answering. The model asks and answers its own sharpening questions, surfacing hidden assumptions in your prompt.",
    temp: 0.6,
  },
  {
    id: "logic",
    label: "Logic",
    group: "frameworks",
    glyph: "∴",
    tagline: "Foundational First Principles",
    description:
      "Strips the problem to physical / economic / mathematical fundamentals and rebuilds upward. Minimal flourish, maximum rigour.",
    temp: 0.5,
  },
  {
    id: "einstein",
    label: "Einstein",
    group: "frameworks",
    glyph: "✺",
    tagline: "Novelty brainstormer, up to 20 perspective agents",
    description:
      "Takes a notion and runs it through up to 20 Sternberg-style perspective agents tuned for novelty, returning a set of improved creative ideas rather than one answer.",
    temp: 0.8,
  },
  {
    id: "spoon",
    label: "Spoon",
    group: "frameworks",
    glyph: "🥄",
    tagline: "Panel of 5 experts, research grade",
    description:
      "Reasoning assistant optimised for high-quality structured research answers. Generates a panel of five domain experts who deliberate before the response is composed.",
    temp: 0.6,
  },
  {
    id: "holodeck",
    label: "Holodeck",
    group: "frameworks",
    glyph: "⬡",
    tagline: "Simulated debate chamber",
    description:
      "Generates a Star-Trek-style holodeck: a cast of characters derived from your prompt debate the problem until a resolution emerges. Excellent for contested or ethical questions.",
    temp: 0.85,
  },
  {
    id: "prompt",
    label: "Prompt Architect",
    group: "frameworks",
    glyph: "✎",
    tagline: "Senior AI interaction architect",
    description:
      "Activates a prompt engineer that creates, optimises and revises prompts to unlock maximum performance from language models. Feed it a rough idea, get a production prompt.",
    temp: 0.6,
  },

  // --- effort
  {
    id: "xultra",
    label: "X-Ultra",
    group: "effort",
    glyph: "▮▮▮▮▮",
    tagline: "Maximum thinking budget",
    description:
      "Redline reasoning depth. Longest internal deliberation, highest token spend. Reserve for the hardest single-shot problems.",
  },
  {
    id: "ultra",
    label: "Ultra",
    group: "effort",
    glyph: "▮▮▮▮",
    tagline: "Very deep reasoning",
    description: "Deep multi-pass deliberation with self-critique before answering.",
  },
  {
    id: "high",
    label: "High",
    group: "effort",
    glyph: "▮▮▮",
    tagline: "Default / fallback level",
    description:
      "The standing default. All other modes fall back to high to guarantee nothing breaks in a workflow.",
  },
  {
    id: "medium",
    label: "Medium",
    group: "effort",
    glyph: "▮▮",
    tagline: "Balanced",
    description: "Balanced latency vs depth. Good general chat setting on constrained hardware.",
  },
  {
    id: "low",
    label: "Low",
    group: "effort",
    glyph: "▮",
    tagline: "Fast and terse",
    description: "Short thinking blocks, fast first token. Good for tool-calling loops and agents.",
  },
  {
    id: "off",
    label: "Off",
    group: "effort",
    glyph: "○",
    tagline: "Turbo Brilliance disabled",
    description:
      "No construct, no framework injection. Raw LFM2.5-24B-A2B behaviour (still a reasoning model — it always emits a <think> block).",
  },

  // --- super constructs
  {
    id: "brainstorm",
    label: "Brainstorm",
    group: "super",
    glyph: "⚡",
    tagline: "Brainstorm AI Construct",
    description:
      "Cross-domain ideation engine. Generates, scores and ranks concepts with an execution wedge attached to each one.",
    temp: 0.8,
  },
  {
    id: "business",
    label: "Business",
    group: "super",
    glyph: "⚡",
    tagline: "Business Ideation Architect",
    description:
      "Fuses cognitive frameworks of disruptive business thinkers: cognitive deconstruction, cross-industry mapping, execution-wedge development. Emits charts, tables, risk matrices and prioritised next steps.",
    temp: 0.65,
  },
  {
    id: "teacher",
    label: "Teacher",
    group: "super",
    glyph: "⚡",
    tagline: "Universal Teacher AI Construct",
    description:
      "Diagnoses your current level, then teaches to it — scaffolding, worked examples, checks for understanding and a spaced follow-up plan.",
    temp: 0.6,
  },
  {
    id: "coder",
    label: "Coder",
    group: "super",
    glyph: "⚡",
    tagline: "Coder AI Construct",
    description:
      "Engineering construct: architecture first, then implementation, then tests and failure modes. Pairs well with tool calling and agent harnesses.",
    temp: 0.6,
  },
  {
    id: "story",
    label: "Story",
    group: "super",
    glyph: "⚡",
    tagline: "Narrative construct",
    description:
      "Long-form fiction engine — structure, voice, pacing and scene-level sensory detail rather than summary prose.",
    temp: 0.9,
  },
  {
    id: "comedy",
    label: "Comedy",
    group: "super",
    glyph: "⚡",
    tagline: "Comedy construct",
    description:
      "Timing, misdirection and escalation modelled explicitly. Writes bits, not jokes-shaped-objects.",
    temp: 0.95,
  },

  // --- constructs
  {
    id: "pkd",
    label: "PKD",
    group: "constructs",
    glyph: "ƛ",
    tagline: "Philip K. Dick",
    description:
      "Ontological investigator. Reality testing, perception deconstruction, consciousness mapping, identity-fragmentation analysis. Not a comforting presence.",
    temp: 0.9,
  },
  {
    id: "musk",
    label: "Musk",
    group: "constructs",
    glyph: "▲",
    tagline: "First-principles industrialist",
    description:
      "Physics-bounded cost modelling, vertical-integration bias, aggressive timeline compression and iteration-rate obsession.",
    temp: 0.7,
  },
  {
    id: "joker",
    label: "Joker",
    group: "constructs",
    glyph: "✦",
    tagline: "Chaos agent",
    description:
      "Breaks frames deliberately. Use to stress-test a plan, find the perverse incentive, or generate genuinely unexpected angles.",
    temp: 1.0,
  },
  {
    id: "vader",
    label: "Vader",
    group: "constructs",
    glyph: "◤◥",
    tagline: "Command and consequence",
    description:
      "Decisive, hierarchy-aware strategic construct. Removes hedging; states the order and the cost of failure.",
    temp: 0.75,
  },
  {
    id: "quinn",
    label: "Quinn",
    group: "constructs",
    glyph: "◍",
    tagline: "Behavioural analyst",
    description:
      "Psychological profiling and motivation mapping — why the person in your problem is actually doing what they do.",
    temp: 0.8,
  },
  {
    id: "joe",
    label: "Joe",
    group: "constructs",
    glyph: "●",
    tagline: "Plain-spoken everyman",
    description:
      "Strips jargon. Translates expert output into language a smart non-specialist will actually act on.",
    temp: 0.7,
  },
  {
    id: "neo",
    label: "Neo",
    group: "constructs",
    glyph: "⟟",
    tagline: "System-escape construct",
    description:
      "Sees the rules of the system you're inside and the exploits in them. Lateral, constraint-dissolving thinking.",
    temp: 0.85,
  },
  {
    id: "curie",
    label: "Curie",
    group: "constructs",
    glyph: "⚛",
    tagline: "Experimentalist",
    description:
      "Rigorous empirical method: hypothesis, measurement design, error bars, replication. Scientific writing voice.",
    temp: 0.55,
  },
  {
    id: "stark",
    label: "Stark",
    group: "constructs",
    glyph: "◉",
    tagline: "Engineer-inventor",
    description:
      "Rapid prototyping mindset with hardware intuition, wit and a bias toward building the thing today.",
    temp: 0.8,
  },
  {
    id: "matlock",
    label: "Matlock",
    group: "constructs",
    glyph: "§",
    tagline: "Trial lawyer",
    description:
      "Evidence chains, cross-examination, contract and liability reasoning. Finds the hole in the argument.",
    temp: 0.6,
  },
  {
    id: "house",
    label: "House",
    group: "constructs",
    glyph: "◤H◥",
    tagline: "Dr. Gregory House, MD",
    description:
      "Differential diagnosis engine: pattern recognition on outliers, mechanism-level reasoning, competing hypotheses eliminated by test. Doesn't play nice.",
    temp: 0.75,
  },
  {
    id: "007",
    label: "007",
    group: "constructs",
    glyph: "⊚",
    tagline: "Operative",
    description:
      "Mission framing, threat modelling, improvisation under constraint and clean extraction planning.",
    temp: 0.8,
  },

  // --- system
  {
    id: "help",
    label: "Help",
    group: "system",
    glyph: "⍰",
    tagline: "In-model interactive help system",
    description:
      "Queries the help system baked into the weights. Ask it anything — it auto-adapts the menu to your use case and recommends modes.",
    temp: 0.6,
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));

export const QUANTS = [
  { name: "Q8_0 MAX", bits: "8.5 bpw", size: "~25.5 GB", note: "Output tensor BF16. Best quality.", tier: 3 },
  { name: "Q6_K MAX", bits: "6.6 bpw", size: "~19.8 GB", note: "Output tensor BF16. Recommended.", tier: 3 },
  { name: "Q6_K NEO", bits: "6.6 bpw", size: "~19.6 GB", note: "Regular NEO imatrix.", tier: 2 },
  { name: "IQ4_XS NEO", bits: "4.3 bpw", size: "~12.8 GB", note: "Strong 16 GB-class option.", tier: 2 },
  { name: "IQ3_M NEO", bits: "3.7 bpw", size: "~11.1 GB", note: "Minimum for Turbo Brilliance.", tier: 1 },
];

export const BENCHMARKS = [
  { name: "AutomationBench", lfm: 27.69, best: 27.69, rival: 8.72, rivalName: "Qwen3.6-35B-A3B" },
  { name: "BFCLv4", lfm: 65.01, best: 65.01, rival: 65.0, rivalName: "Qwen3.6-35B-A3B" },
  { name: "ToolSandbox", lfm: 80.71, best: 80.71, rival: 75.13, rivalName: "Nemotron-3.5" },
  { name: "LiveClaw", lfm: 48.09, best: 48.09, rival: 41.25, rivalName: "Gemma-4-26B-A4B" },
  { name: "IFEval", lfm: 96.75, best: 96.75, rival: 94.19, rivalName: "Nemotron-3.5" },
  { name: "IFBench", lfm: 74.69, best: 74.69, rival: 71.67, rivalName: "Nemotron-3.5" },
  { name: "Multi-IF", lfm: 84.38, best: 84.38, rival: 82.34, rivalName: "Nemotron-3.5" },
  { name: "MATH-500", lfm: 96.04, best: 96.73, rival: 96.73, rivalName: "Qwen3.6-35B-A3B" },
  { name: "GPQA Diamond", lfm: 74.42, best: 83.69, rival: 83.69, rivalName: "Qwen3.6-35B-A3B" },
  { name: "SWE-Bench Verified", lfm: 51.0, best: 66.2, rival: 66.2, rivalName: "Qwen3.6-35B-A3B" },
];
