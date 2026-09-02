import { describe, expect, it } from "vitest";
import { DEMO_OBSERVATION } from "./demoData";
import { DemoStore } from "./demoStore";
import { createToolDefinitions, READ_ONLY_TOOL_NAMES, TOOL_NAMES } from "./webmcp";

const serialise = (value: unknown) => JSON.stringify(value).toLowerCase();

describe("Infinite Awareness judge sandbox", () => {
  it("discovers exactly the eight required top-level tool definitions", () => {
    const tools = createToolDefinitions(new DemoStore());
    expect(tools.map((tool) => tool.name)).toEqual(TOOL_NAMES);
    expect(tools).toHaveLength(8);
  });

  it("marks exactly four tools read-only and those tools do not alter domain state", async () => {
    const store = new DemoStore();
    const tools = createToolDefinitions(store);
    const before = structuredClone(store.getState());

    for (const name of READ_ONLY_TOOL_NAMES) {
      const tool = tools.find((candidate) => candidate.name === name)!;
      await tool.execute(name === "compare_collective_signal" ? { minimumSample: 40 } : {});
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(store.getState()).toEqual(before);
    }
    expect(tools.filter((tool) => tool.annotations.readOnlyHint)).toHaveLength(4);
  });

  it("blocks save before confirmation, succeeds once, then blocks replay", () => {
    const store = new DemoStore();
    store.prepareSession(3);
    store.completeSession();
    store.draftObservation(DEMO_OBSERVATION);

    expect(() => store.saveConfirmedObservation()).toThrow(/visible save confirmation/i);
    store.setSaveConfirmation(true);
    expect(store.saveConfirmedObservation()).toMatchObject({
      status: "saved_to_ephemeral_demo_state",
      persistedBeyondThisPage: false,
    });
    expect(store.getState().saveConfirmation).toEqual({ armed: false, consumed: true });
    expect(() => store.saveConfirmedObservation()).toThrow(/already consumed/i);
  });

  it("blocks score recording before confirmation, succeeds once, then blocks replay", () => {
    const store = new DemoStore();
    store.prepareSession(3);
    store.completeSession();
    store.draftObservation(DEMO_OBSERVATION);
    store.setSaveConfirmation(true);
    store.saveConfirmedObservation();

    const scores = { usefulness: 4, novelty: 3, testability: 5 };
    expect(() => store.scoreBlindedOutcome(scores)).toThrow(/visible score confirmation/i);
    store.setScoreConfirmation(true);
    expect(store.scoreBlindedOutcome(scores)).toMatchObject({
      status: "scores_recorded_without_unblinding",
      scores,
      assignmentRevealed: false,
    });
    expect(store.getState().scoreConfirmation).toEqual({ armed: false, consumed: true });
    expect(() => store.scoreBlindedOutcome(scores)).toThrow(/already consumed/i);
  });

  it("enforces the fictional cohort threshold before revealing aggregates", () => {
    const store = new DemoStore();
    expect(store.compareCollectiveSignal(49)).toEqual({
      eligible: false,
      fictionalCohortSessions: 48,
      minimumSample: 49,
      aggregateSuppressed: true,
      reason: "The fictional cohort does not meet the requested minimum sample threshold.",
    });
    expect(store.compareCollectiveSignal(40)).toMatchObject({
      eligible: true,
      fictionalCohortSessions: 48,
      minimumSample: 40,
      aggregateSuppressed: false,
    });
  });

  it("never contains or returns an experimental assignment", async () => {
    const store = new DemoStore();
    const tools = createToolDefinitions(store);
    const outputs = [];
    for (const tool of tools.filter((candidate) => candidate.annotations.readOnlyHint)) {
      outputs.push(await tool.execute(tool.name === "compare_collective_signal" ? { minimumSample: 40 } : {}));
    }
    const text = serialise({ state: store.getState(), outputs });
    expect(text).not.toContain('"assignment":"');
    expect(text).not.toContain('"experimentalcondition"');
    expect(text).not.toContain('"condition":"');
  });

  it("resets the complete fictional journey to its pristine state", () => {
    const store = new DemoStore();
    store.prepareSession(3);
    store.completeSession();
    store.draftObservation(DEMO_OBSERVATION);
    store.setSaveConfirmation(true);
    store.saveConfirmedObservation();
    store.setScoreConfirmation(true);
    store.scoreBlindedOutcome({ usefulness: 4, novelty: 3, testability: 5 });
    store.reset();

    expect(store.getState()).toMatchObject({
      sessionStage: "not-prepared",
      observationInput: "",
      draft: null,
      savedObservation: null,
      recordedScores: null,
      saveConfirmation: { armed: false, consumed: false },
      scoreConfirmation: { armed: false, consumed: false },
    });
  });
});
