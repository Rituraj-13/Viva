export const RUNGS = [
  "comprehension",
  "decision",
  "failure",
  "change",
  "ownership",
] as const;

export type Rung = (typeof RUNGS)[number];

export const MAX_TURNS = 8;

export const RUNG_LABELS: Record<Rung, string> = {
  comprehension: "Comprehension",
  decision: "Decision",
  failure: "Failure",
  change: "Change",
  ownership: "Ownership",
};

export type Verdict = "strong" | "partial" | "weak" | "off_topic";

export type Evaluation = {
  verdict: Verdict;
  correctness: number;
  depth: number;
  ownership: number;
  clarity: number;
  confidence: number;
  quote: string;
  quoteIsStrength: boolean;
  missing: string[];
  followUp: string | null;
  followUpReason: string | null;
};

export type Question = {
  id: string;
  index: number;
  rung: Rung;
  prompt: string;
  focusStart: number;
  focusEnd: number;
  expectedPoints: string[];
  redFlags: string[];
  whyThisQuestion: string;
};

export type Turn = {
  id: string;
  questionId: string;
  parentTurnId: string | null;
  kind: "answer" | "probe";
  prompt: string;
  answer: string;
  inputMode: "flow" | "typed" | "web_speech";
  skipped?: boolean;
  evaluation: Evaluation | null;
  createdAt: string;
};

export type AxisKey = "correctness" | "depth" | "ownership" | "clarity";

export type Axis = {
  key: AxisKey;
  label: string;
  score: number;
  evidenceQuote: string;
  line: number;
  note: string;
};

export type Report = {
  band: "ready" | "almost" | "not_yet";
  headline: string;
  summary: string;
  axes: Axis[];
  confidentButWrong: { questionIndex: number; quote: string; why: string } | null;
  quietlyRight: { questionIndex: number; quote: string } | null;
  bestMoment: { questionIndex: number; quote: string } | null;
  nextQuestions: string[];
  createdAt: string;
};

export type FocusRegion = {
  start: number;
  end: number;
  label: string;
};

export type SessionData = {
  id: string;
  slug: string;
  anonId: string;
  source: "github" | "paste";
  repoUrl?: string;
  repoOwner?: string;
  repoName?: string;
  filePath: string;
  language: string;
  code: string;
  lineCount: number;
  status: "ready" | "in_progress" | "reported";
  summary: string;
  focusRegions: FocusRegion[];
  questions: Question[];
  turns: Turn[];
  report?: Report;
  model?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicQuestion = Omit<
  Question,
  "expectedPoints" | "redFlags" | "whyThisQuestion"
>;

export type PublicTurn = Omit<Turn, "evaluation">;

export type PublicSession = Omit<
  SessionData,
  "anonId" | "questions" | "turns"
> & {
  questions: PublicQuestion[];
  turns: PublicTurn[];
};

export type SessionState = {
  activeQuestionId: string | null;
  activeProbeId: string | null;
  answered: number;
  total: number;
  turns: number;
  done: boolean;
};

export type ReportCopy = {
  headline: string;
  summary: string;
  nextQuestions: string[];
};

export type TranscriptProbe = {
  prompt: string;
  answer: string;
  skipped?: boolean;
  inputMode?: string;
  evaluation?: Evaluation | null;
};

export type TranscriptEntry = {
  index: number;
  rung: string;
  prompt: string;
  answer: string;
  skipped?: boolean;
  inputMode?: string;
  probes: TranscriptProbe[];
  evaluation?: Evaluation | null;
};
