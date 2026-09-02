import { DemoStore, type ToolBoundaryError } from "./demoStore";
import type { ScoreSet } from "./demoData";

export const TOOL_NAMES = [
  "get_today_protocol",
  "prepare_session",
  "draft_observation",
  "save_confirmed_observation",
  "score_blinded_outcome",
  "analyse_personal_signal",
  "compare_collective_signal",
  "explain_safety_boundary",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const READ_ONLY_TOOL_NAMES: ToolName[] = [
  "get_today_protocol",
  "analyse_personal_signal",
  "compare_collective_signal",
  "explain_safety_boundary",
];

export type WebMcpTool = {
  name: ToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export const createToolDefinitions = (store: DemoStore): WebMcpTool[] => [
  {
    name: "get_today_protocol",
    title: "Get today’s protocol",
    description:
      "Read Alex Morgan’s fictional Day 7 protocol, purpose and demonstration length. This does not change page state or reveal the hidden assignment.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: true },
    execute: async () => store.getTodayProtocol(),
  },
  {
    name: "prepare_session",
    title: "Prepare demonstration session",
    description:
      "Prepare the fixed three-minute Day 7 training interface. This changes visible demo state but does not start, save or score anything.",
    inputSchema: {
      type: "object",
      properties: {
        durationMinutes: {
          type: "integer",
          const: 3,
          default: 3,
          description: "The fixed judge demonstration length: 3 minutes.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => store.prepareSession(Number(input.durationMinutes ?? 3)),
  },
  {
    name: "draft_observation",
    title: "Draft structured observation",
    description:
      "Turn one fictional post-session observation into a visible structured review draft. The draft is not saved and must be reviewed by the person.",
    inputSchema: {
      type: "object",
      properties: {
        observation: {
          type: "string",
          minLength: 12,
          maxLength: 500,
          description: "Fictional direct observation, 12–500 characters. Do not include real personal data.",
        },
      },
      required: ["observation"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async (input) => store.draftObservation(String(input.observation ?? "")),
  },
  {
    name: "save_confirmed_observation",
    title: "Save confirmed observation",
    description:
      "Save the reviewed draft to ephemeral demo state only. Fails unless the person has deliberately selected the visible one-use confirmation on the webpage.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async () => store.saveConfirmedObservation(),
  },
  {
    name: "score_blinded_outcome",
    title: "Record blinded outcome scores",
    description:
      "Record 0–5 usefulness, novelty and testability scores without revealing the experimental assignment. Requires a visible one-use page confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        usefulness: { type: "integer", minimum: 0, maximum: 5, description: "Usefulness score from 0 to 5." },
        novelty: { type: "integer", minimum: 0, maximum: 5, description: "Novelty score from 0 to 5." },
        testability: { type: "integer", minimum: 0, maximum: 5, description: "Testability score from 0 to 5." },
        rationale: { type: "string", maxLength: 240, description: "Optional concise scoring rationale." },
      },
      required: ["usefulness", "novelty", "testability"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: async (input) =>
      store.scoreBlindedOutcome(
        {
          usefulness: Number(input.usefulness),
          novelty: Number(input.novelty),
          testability: Number(input.testability),
        } satisfies ScoreSet,
        typeof input.rationale === "string" ? input.rationale : undefined,
      ),
  },
  {
    name: "analyse_personal_signal",
    title: "Analyse personal signal",
    description:
      "Read aggregate patterns across Alex’s fictional session history and recorded scores. Returns descriptive summaries only and does not change state.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: true },
    execute: async () => store.analysePersonalSignal(),
  },
  {
    name: "compare_collective_signal",
    title: "Compare Global Signal",
    description:
      "Compare fictional personal aggregates with the fictional 48-session Global Signal only when the requested minimum sample threshold is met.",
    inputSchema: {
      type: "object",
      properties: {
        minimumSample: {
          type: "integer",
          minimum: 20,
          maximum: 100,
          default: 40,
          description: "Minimum fictional cohort size required before aggregate comparison.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => store.compareCollectiveSignal(Number(input.minimumSample ?? 40)),
  },
  {
    name: "explain_safety_boundary",
    title: "Explain safety and privacy",
    description:
      "Read the sandbox’s educational scope, privacy boundary, epistemic caution and stop rule. This does not change page state.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: true },
    execute: async () => store.explainSafetyBoundary(),
  },
];

export const toToolErrorResult = (error: unknown) => ({
  ok: false,
  error:
    error instanceof Error
      ? error.message
      : "The fictional demonstration could not complete that action.",
  boundaryEnforced: (error as ToolBoundaryError)?.name === "ToolBoundaryError",
});
