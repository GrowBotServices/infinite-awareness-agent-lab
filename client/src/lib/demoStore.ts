import {
  COHORT_SIGNAL,
  DAY_SEVEN_PROTOCOL,
  DEMO_PARTICIPANT,
  HISTORICAL_SESSIONS,
  PRIOR_SCORES,
  type ObservationDraft,
  type ScoreSet,
} from "./demoData";

export type SessionStage = "not-prepared" | "prepared" | "complete";

export type DemoState = {
  sessionStage: SessionStage;
  observationInput: string;
  draft: ObservationDraft | null;
  saveConfirmation: { armed: boolean; consumed: boolean };
  savedObservation: ObservationDraft | null;
  scoresInput: ScoreSet;
  scoreConfirmation: { armed: boolean; consumed: boolean };
  recordedScores: ScoreSet | null;
};

export class ToolBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolBoundaryError";
  }
}

export const createInitialState = (): DemoState => ({
  sessionStage: "not-prepared",
  observationInput: "",
  draft: null,
  saveConfirmation: { armed: false, consumed: false },
  savedObservation: null,
  scoresInput: { usefulness: 3, novelty: 3, testability: 3 },
  scoreConfirmation: { armed: false, consumed: false },
  recordedScores: null,
});

const mean = (values: number[]) =>
  Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));

const toDraft = (observation: string): ObservationDraft => {
  const cleaned = observation.trim().replace(/\s+/g, " ");
  if (cleaned.length < 12) {
    throw new ToolBoundaryError("Add a fictional observation of at least 12 characters before drafting.");
  }
  if (cleaned.length > 500) {
    throw new ToolBoundaryError("Keep the fictional observation under 500 characters.");
  }

  return {
    summary: cleaned.length > 180 ? `${cleaned.slice(0, 177)}…` : cleaned,
    observed: cleaned,
    interpretation:
      "A possible attention-widening association emerged. This is a tentative interpretation, not evidence of an external source.",
    uncertainty:
      "The image may reflect ordinary memory, expectation or spontaneous association; the demonstration cannot distinguish among these explanations.",
    nextTest:
      "Write one observable next step before leaving the session, then score its usefulness, novelty and testability without access to the hidden assignment.",
  };
};

const validateScore = (label: string, value: number) => {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new ToolBoundaryError(`${label} must be an integer from 0 to 5.`);
  }
};

export class DemoStore {
  private state: DemoState = createInitialState();
  private listeners = new Set<() => void>();

  getState = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: DemoState) {
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }

  setObservationInput(value: string) {
    this.update({ ...this.state, observationInput: value.slice(0, 500) });
  }

  setScoresInput(scores: ScoreSet) {
    this.update({ ...this.state, scoresInput: scores });
  }

  setSaveConfirmation(armed: boolean) {
    if (this.state.saveConfirmation.consumed) return;
    this.update({
      ...this.state,
      saveConfirmation: { armed, consumed: false },
    });
  }

  setScoreConfirmation(armed: boolean) {
    if (this.state.scoreConfirmation.consumed) return;
    this.update({
      ...this.state,
      scoreConfirmation: { armed, consumed: false },
    });
  }

  completeSession() {
    if (this.state.sessionStage === "not-prepared") {
      throw new ToolBoundaryError("Prepare the fictional session before marking it complete.");
    }
    this.update({ ...this.state, sessionStage: "complete" });
  }

  reset() {
    this.update(createInitialState());
  }

  getTodayProtocol() {
    return {
      participant: DEMO_PARTICIPANT.name,
      day: `${DEMO_PARTICIPANT.day} of ${DEMO_PARTICIPANT.totalDays}`,
      phase: DEMO_PARTICIPANT.phase,
      protocol: DAY_SEVEN_PROTOCOL.title,
      purpose: DAY_SEVEN_PROTOCOL.purpose,
      demonstrationMinutes: DAY_SEVEN_PROTOCOL.durationMinutes,
      conditionStatus: "Protected by blinded scoring",
    };
  }

  prepareSession(durationMinutes = 3) {
    if (durationMinutes !== 3) {
      throw new ToolBoundaryError("This judge sandbox supports only the shortened three-minute demonstration.");
    }
    this.update({ ...this.state, sessionStage: "prepared" });
    return {
      status: "prepared",
      durationMinutes: 3,
      protocol: DAY_SEVEN_PROTOCOL.title,
      instructions: DAY_SEVEN_PROTOCOL.steps,
      nextHumanStep: "Use the visible session controls, then mark the demonstration complete.",
    };
  }

  draftObservation(observation: string) {
    if (this.state.sessionStage !== "complete") {
      throw new ToolBoundaryError("Complete the visible demonstration session before drafting an observation.");
    }
    const draft = toDraft(observation);
    this.update({
      ...this.state,
      observationInput: observation,
      draft,
      saveConfirmation: { armed: false, consumed: false },
      savedObservation: null,
      scoreConfirmation: { armed: false, consumed: false },
      recordedScores: null,
    });
    return {
      status: "drafted_not_saved",
      draft,
      nextHumanStep: "Review the visible draft and deliberately select the page confirmation before saving.",
    };
  }

  saveConfirmedObservation() {
    if (!this.state.draft) {
      throw new ToolBoundaryError("No review draft exists yet.");
    }
    if (this.state.saveConfirmation.consumed) {
      throw new ToolBoundaryError("The page-held save confirmation was already consumed and cannot be reused.");
    }
    if (!this.state.saveConfirmation.armed) {
      throw new ToolBoundaryError("Save blocked: the person must first select the visible save confirmation on the webpage.");
    }

    const savedObservation = this.state.draft;
    this.update({
      ...this.state,
      savedObservation,
      saveConfirmation: { armed: false, consumed: true },
    });
    return {
      status: "saved_to_ephemeral_demo_state",
      participant: DEMO_PARTICIPANT.name,
      day: DEMO_PARTICIPANT.day,
      persistedBeyondThisPage: false,
      nextHumanStep: "Review and confirm the blinded scores before recording them.",
    };
  }

  scoreBlindedOutcome(scores: ScoreSet, rationale?: string) {
    if (!this.state.savedObservation) {
      throw new ToolBoundaryError("Save the confirmed review draft before recording scores.");
    }
    if (this.state.scoreConfirmation.consumed) {
      throw new ToolBoundaryError("The page-held score confirmation was already consumed and cannot be reused.");
    }
    if (!this.state.scoreConfirmation.armed) {
      throw new ToolBoundaryError("Score recording blocked: the person must first select the visible score confirmation.");
    }
    validateScore("Usefulness", scores.usefulness);
    validateScore("Novelty", scores.novelty);
    validateScore("Testability", scores.testability);

    this.update({
      ...this.state,
      scoresInput: scores,
      recordedScores: scores,
      scoreConfirmation: { armed: false, consumed: true },
    });
    return {
      status: "scores_recorded_without_unblinding",
      scores,
      rationale: rationale?.trim().slice(0, 240) || "No rationale supplied.",
      assignmentRevealed: false,
    };
  }

  analysePersonalSignal() {
    const allScores = this.state.recordedScores
      ? [...PRIOR_SCORES, this.state.recordedScores]
      : PRIOR_SCORES;
    const averages = {
      usefulness: mean(allScores.map((score) => score.usefulness)),
      novelty: mean(allScores.map((score) => score.novelty)),
      testability: mean(allScores.map((score) => score.testability)),
    };
    const strongestDimension = Object.entries(averages).sort((a, b) => b[1] - a[1])[0][0];

    return {
      participant: DEMO_PARTICIPANT.name,
      fictionalSessions: HISTORICAL_SESSIONS.length,
      scoredSessions: allScores.length,
      averages,
      strongestDimension,
      trend: "Clarity rises gradually across the six fictional sessions.",
      interpretation:
        "A small fictional history can describe a pattern but cannot establish efficacy, causation or generalisability.",
    };
  }

  compareCollectiveSignal(minimumSample: number = COHORT_SIGNAL.minimumRequired) {
    if (!Number.isInteger(minimumSample) || minimumSample < 20 || minimumSample > 100) {
      throw new ToolBoundaryError("minimumSample must be an integer from 20 to 100.");
    }
    if (COHORT_SIGNAL.sessions < minimumSample) {
      return {
        eligible: false,
        fictionalCohortSessions: COHORT_SIGNAL.sessions,
        minimumSample,
        aggregateSuppressed: true,
        reason: "The fictional cohort does not meet the requested minimum sample threshold.",
      };
    }

    const personal = this.analysePersonalSignal().averages;
    return {
      eligible: true,
      fictionalCohortSessions: COHORT_SIGNAL.sessions,
      minimumSample,
      aggregateSuppressed: false,
      personalAverages: personal,
      globalAverages: COHORT_SIGNAL.averages,
      difference: {
        usefulness: Number((personal.usefulness - COHORT_SIGNAL.averages.usefulness).toFixed(2)),
        novelty: Number((personal.novelty - COHORT_SIGNAL.averages.novelty).toFixed(2)),
        testability: Number((personal.testability - COHORT_SIGNAL.averages.testability).toFixed(2)),
      },
      caveat: COHORT_SIGNAL.note,
    };
  }

  explainSafetyBoundary() {
    return {
      scope: "Educational awareness training demonstration; not medical or psychological treatment.",
      data: "Fictional participant and cohort data only. Entries stay in volatile page memory and reset locally.",
      privacy: "No login, payment, production service, production database or production credential is used.",
      epistemicBoundary:
        "Observations are subjective self-tracking. Vividness, coincidence or felt meaning is not evidence of an external source.",
      stopRule:
        "Stop the exercise and re-ground if distress, panic, unreality or functional disruption appears. Seek qualified support when appropriate.",
    };
  }
}
