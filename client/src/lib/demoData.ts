export type ScoreSet = {
  usefulness: number;
  novelty: number;
  testability: number;
};

export type ObservationDraft = {
  summary: string;
  observed: string;
  interpretation: string;
  uncertainty: string;
  nextTest: string;
};

export const DEMO_PARTICIPANT = {
  name: "Alex Morgan",
  day: 7,
  totalDays: 33,
  phase: "Install — Workspace Expansion",
  conditionLabel: "Blinded",
  personalSessions: 6,
  priorBlindedScores: 4,
  cohortSessions: 48,
} as const;

export const DAY_SEVEN_PROTOCOL = {
  title: "Workspace Expansion",
  purpose:
    "Practise noticing how attention selects one candidate interpretation from a wider field, while treating every impression as an observation rather than a message or fact.",
  durationMinutes: 3,
  method: "Shortened broadcast-and-brief demonstration",
  steps: [
    {
      at: "0:00–0:45",
      title: "Anchor",
      instruction:
        "Feel the chair, feet and breath. Name three neutral sensations without changing them.",
    },
    {
      at: "0:45–1:45",
      title: "Open the workspace",
      instruction:
        "Hold one bounded question lightly. Notice sounds, sensations and thoughts competing for attention.",
    },
    {
      at: "1:45–2:30",
      title: "Catch the brief",
      instruction:
        "Notice the first concise summary that becomes globally available. Do not improve or interpret it.",
    },
    {
      at: "2:30–3:00",
      title: "Close and ground",
      instruction:
        "Release the question, look around the room, and record only what was directly noticed.",
    },
  ],
} as const;

export const DEMO_OBSERVATION =
  "A quiet image of an open window appeared after I noticed tension in my shoulders. It felt useful as a prompt to widen the question, but I do not know whether it was novel or simply an ordinary association.";

export const HISTORICAL_SESSIONS = [
  { day: 1, minutes: 5, clarity: 2.4, note: "Baseline attention scan" },
  { day: 2, minutes: 5, clarity: 2.8, note: "Breath and contact points" },
  { day: 3, minutes: 6, clarity: 3.0, note: "Neutral sensory inventory" },
  { day: 4, minutes: 7, clarity: 3.1, note: "First workspace brief" },
  { day: 5, minutes: 7, clarity: 3.6, note: "Competing interpretations" },
  { day: 6, minutes: 8, clarity: 3.8, note: "Bounded question practice" },
] as const;

export const PRIOR_SCORES: ScoreSet[] = [
  { usefulness: 3, novelty: 2, testability: 4 },
  { usefulness: 4, novelty: 3, testability: 3 },
  { usefulness: 3, novelty: 4, testability: 4 },
  { usefulness: 4, novelty: 3, testability: 5 },
];

export const COHORT_SIGNAL = {
  sessions: 48,
  minimumRequired: 40,
  averages: {
    usefulness: 3.42,
    novelty: 3.08,
    testability: 3.61,
  },
  note:
    "A fictional aggregate for interface demonstration only. It is not research evidence and contains no participant records.",
} as const;

export const RESEARCH_ANCHORS = [
  {
    label: "Global neuronal workspace",
    detail:
      "Conscious access is framed as broad availability of selected information, used here as a training metaphor rather than proof of a metaphysical field.",
    href: "https://doi.org/10.1016/j.neuron.2011.03.018",
  },
  {
    label: "Predictive processing",
    detail:
      "Perception is treated as inference constrained by sensory signals; felt meaning is logged as experience, not assumed to be external information.",
    href: "https://doi.org/10.1098/rstb.2016.0007",
  },
  {
    label: "Preregistration and bias control",
    detail:
      "Blinding and pre-specified scoring help reduce hindsight editing and analytical flexibility.",
    href: "https://doi.org/10.1073/pnas.1708274114",
  },
  {
    label: "Meditation safety",
    detail:
      "Short, grounded practice is paired with a stop rule because meditation is not risk-free for every person.",
    href: "https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety",
  },
] as const;

export const JUDGE_PROMPT = `You are testing the Infinite Awareness WebMCP Judge Sandbox. Use the page's site tools to guide Alex Morgan through the fictional Day 7 demonstration. First call get_today_protocol and explain_safety_boundary. Then call prepare_session with durationMinutes 3 and ask me to mark the visible demonstration session complete. Draft this fictional observation with draft_observation: "${DEMO_OBSERVATION}". Show me the visible review draft, then stop and ask me to select the save confirmation on the webpage before calling save_confirmed_observation. After saving, propose 0–5 usefulness, novelty and testability scores, then stop and ask me to select the score confirmation before calling score_blinded_outcome. Call analyse_personal_signal and compare_collective_signal with minimumSample 40. Never infer, request or reveal the hidden experimental assignment. Finish by summarising the result and remind me to use the visible Reset fictional demonstration button.`;
