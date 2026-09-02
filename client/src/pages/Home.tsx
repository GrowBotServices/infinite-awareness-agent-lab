/** Scientific Ether: an asymmetric participant journey with calm instrumentation and visible human agency. */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, Clipboard, Copy,
  EyeOff, FileCheck2, FlaskConical, Gauge, LockKeyhole, Pause, Play, RefreshCcw,
  ShieldCheck, Sparkles, TimerReset, Waves,
} from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/BrandMark";
import { ScoreControl } from "@/components/ScoreControl";
import { ToolResultDock, type VisibleToolResult } from "@/components/ToolResultDock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COHORT_SIGNAL, DAY_SEVEN_PROTOCOL, DEMO_OBSERVATION, DEMO_PARTICIPANT,
  HISTORICAL_SESSIONS, JUDGE_PROMPT, PRIOR_SCORES, RESEARCH_ANCHORS, type ScoreSet,
} from "@/lib/demoData";
import { DemoStore } from "@/lib/demoStore";
import {
  createToolDefinitions, READ_ONLY_TOOL_NAMES, TOOL_NAMES, toToolErrorResult, type ToolName,
} from "@/lib/webmcp";

const store = new DemoStore();
const SESSION_SECONDS = 180;
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const average = (values: number[]) => (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

export default function Home() {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const tools = useMemo(() => createToolDefinitions(store), []);
  const [toolResult, setToolResult] = useState<VisibleToolResult | null>(null);
  const [webMcpSupport, setWebMcpSupport] = useState<"checking" | "available" | "fallback" | "error">("checking");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [minimumSample, setMinimumSample] = useState(40);
  const [promptCopied, setPromptCopied] = useState(false);

  const publishResult = useCallback((name: string, ok: boolean, output: unknown) => {
    setToolResult({
      name, ok,
      at: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()),
      output,
    });
  }, []);

  const runTool = useCallback(async (name: ToolName, input: Record<string, unknown> = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) return null;
    try {
      const output = await tool.execute(input);
      publishResult(name, true, output);
      return output;
    } catch (error) {
      const output = toToolErrorResult(error);
      publishResult(name, false, output);
      toast.error(output.error);
      return output;
    }
  }, [publishResult, tools]);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (typeof modelContext?.registerTool !== "function") {
      setWebMcpSupport("fallback");
      return;
    }
    const controller = new AbortController();
    const register = async () => {
      try {
        await Promise.all(tools.map((tool) => modelContext.registerTool({
          ...tool,
          execute: async (input) => {
            try {
              const output = await tool.execute(input);
              publishResult(tool.name, true, output);
              return output;
            } catch (error) {
              const output = toToolErrorResult(error);
              publishResult(tool.name, false, output);
              throw error;
            }
          },
        }, { signal: controller.signal })));
        const discovered = modelContext.getTools ? await modelContext.getTools() : [];
        const exactTools = discovered.filter((tool) => TOOL_NAMES.includes(tool.name as ToolName));
        setRegisteredCount(exactTools.length || TOOL_NAMES.length);
        setWebMcpSupport("available");
      } catch (error) {
        if (!controller.signal.aborted) {
          setWebMcpSupport("error");
          publishResult("tool_registration", false, toToolErrorResult(error));
        }
      }
    };
    void register();
    return () => controller.abort();
  }, [publishResult, tools]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          try {
            store.completeSession();
            publishResult("visible_session", true, {
              status: "three_minute_demonstration_complete",
              nextHumanStep: "Enter one fictional observation.",
            });
          } catch { /* Session remains restartable if preparation changed. */ }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [publishResult, timerRunning]);

  const updateScore = (key: keyof ScoreSet, value: number) =>
    store.setScoresInput({ ...store.getState().scoresInput, [key]: value });

  const markSessionComplete = () => {
    try {
      store.completeSession();
      setTimerRunning(false);
      setSecondsLeft(0);
      publishResult("visible_session", true, {
        status: "demonstration_marked_complete",
        nextHumanStep: "Enter a fictional observation and create a review draft.",
      });
    } catch (error) {
      const result = toToolErrorResult(error);
      publishResult("visible_session", false, result);
      toast.error(result.error);
    }
  };

  const resetDemo = () => {
    store.reset();
    setTimerRunning(false);
    setSecondsLeft(SESSION_SECONDS);
    setMinimumSample(40);
    publishResult("visible_reset", true, {
      status: "fictional_demonstration_reset",
      persistentDataRemoved: false,
      note: "All ephemeral page state returned to the initial judge scenario.",
    });
    toast.success("Fictional demonstration reset");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyJudgePrompt = async () => {
    await navigator.clipboard.writeText(JUDGE_PROMPT);
    setPromptCopied(true);
    window.setTimeout(() => setPromptCopied(false), 1600);
    toast.success("Judge prompt copied");
  };

  const personalScores = state.recordedScores ? [...PRIOR_SCORES, state.recordedScores] : PRIOR_SCORES;
  const personalAverages = {
    usefulness: Number(average(personalScores.map((score) => score.usefulness))),
    novelty: Number(average(personalScores.map((score) => score.novelty))),
    testability: Number(average(personalScores.map((score) => score.testability))),
  };
  const thresholdMet = COHORT_SIGNAL.sessions >= minimumSample;

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <BrandMark className="brand-mark" />
        <div><strong>Infinite Awareness</strong><span>Judge sandbox</span></div>
        <span className="fiction-badge"><FlaskConical size={13} /> Fiction only</span>
      </header>

      <aside className="side-rail">
        <div className="brand-lockup">
          <BrandMark className="brand-mark" />
          <div><strong>Infinite Awareness</strong><span>WebMCP judge sandbox</span></div>
        </div>
        <div className="fiction-panel">
          <FlaskConical size={18} aria-hidden="true" />
          <div><strong>Fiction-only judge sandbox</strong><p>No login, payment, real person or production connection.</p></div>
        </div>
        <nav className="journey-nav" aria-label="Demonstration journey">
          <a href="#dashboard"><span>01</span>Today</a>
          <a href="#session"><span>02</span>Session</a>
          <a href="#reflection"><span>03</span>Reflection</a>
          <a href="#scoring"><span>04</span>Scoring</a>
          <a href="#signal"><span>05</span>Signal</a>
          <a href="#safety"><span>06</span>Safety</a>
        </nav>
        <div className="rail-progress">
          <div className="rail-progress__meta"><span>Programme progress</span><strong>Day 7 / 33</strong></div>
          <div className="progress-track"><span style={{ width: `${(7 / 33) * 100}%` }} /></div>
          <p>{DEMO_PARTICIPANT.phase}</p>
        </div>
        <div className="rail-actions">
          <Button className="prompt-button" onClick={copyJudgePrompt}>
            {promptCopied ? <Check size={16} /> : <Copy size={16} />}{promptCopied ? "Prompt copied" : "Copy judge prompt"}
          </Button>
          <Button variant="outline" className="reset-button" onClick={resetDemo}>
            <RefreshCcw size={16} />Reset fictional demonstration
          </Button>
        </div>
      </aside>

      <main className="journey-main">
        <section id="dashboard" className="hero-section">
          <div className="hero-visual" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-topline">
              <span className="phase-chip"><Sparkles size={14} /> Day 7 · Install</span>
              <span className="blind-chip"><EyeOff size={14} /> Condition hidden</span>
            </div>
            <p className="eyebrow">Today’s participant journey</p>
            <h1>Train the noticing.<br /><span>Measure the signal.</span></h1>
            <p className="hero-lede">A standalone three-minute demonstration of one fictional day in the 33-day Infinite Awareness programme.</p>
            <div className="hero-actions">
              <Button onClick={() => void runTool("get_today_protocol")}>Ask for today’s protocol <ArrowRight size={16} /></Button>
              <Button variant="outline" onClick={() => void runTool("explain_safety_boundary")}><ShieldCheck size={16} /> Safety boundaries</Button>
            </div>
          </div>
        </section>

        <section className="participant-strip" aria-label="Fictional participant overview">
          <div className="participant-identity"><div className="avatar">AM</div><div><span className="eyebrow">Fictional participant</span><h2>{DEMO_PARTICIPANT.name}</h2></div></div>
          <div className="metric"><strong>6</strong><span>Personal sessions</span></div>
          <div className="metric"><strong>4</strong><span>Prior blinded scores</span></div>
          <div className="metric"><strong>48</strong><span>Fictional cohort sessions</span></div>
          <div className="metric metric--protected"><LockKeyhole size={18} /><span>Assignment protected</span></div>
        </section>

        <section className="protocol-card section-card">
          <div className="section-heading"><div><span className="eyebrow">01 · Today’s protocol</span><h2>Workspace Expansion</h2></div><span className="duration-tag">03 MIN DEMO</span></div>
          <p className="protocol-purpose">{DAY_SEVEN_PROTOCOL.purpose}</p>
          <div className="protocol-grid">
            {DAY_SEVEN_PROTOCOL.steps.map((step, index) => (
              <div className="protocol-step" key={step.at}>
                <span className="mono">{step.at}</span><i>{String(index + 1).padStart(2, "0")}</i><h3>{step.title}</h3><p>{step.instruction}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="session" className="session-section section-card">
          <div className="session-art" aria-hidden="true" /><div className="session-overlay" />
          <div className="session-content">
            <BrandMark className="session-watermark" />
            <div className="section-heading section-heading--light">
              <div><span className="eyebrow">02 · Training session</span><h2>Notice what becomes available.</h2></div>
              <span className={`stage-pill stage-pill--${state.sessionStage}`}>{state.sessionStage === "not-prepared" ? "Not prepared" : state.sessionStage === "prepared" ? "Ready" : "Complete"}</span>
            </div>
            <div className="timer-readout" aria-live="polite">{formatTime(secondsLeft)}</div>
            <p>Keep the question bounded. Return to direct sensation whenever interpretation starts to feel certain.</p>
            <div className="session-controls">
              {state.sessionStage === "not-prepared" ? (
                <Button onClick={() => void runTool("prepare_session", { durationMinutes: 3 })}><TimerReset size={17} /> Prepare three-minute session</Button>
              ) : (
                <Button onClick={() => setTimerRunning((current) => !current)} disabled={state.sessionStage === "complete"}>
                  {timerRunning ? <Pause size={17} /> : <Play size={17} />}{timerRunning ? "Pause session" : "Begin session"}
                </Button>
              )}
              <Button variant="outline" className="light-outline" onClick={markSessionComplete} disabled={state.sessionStage !== "prepared"}>
                <CheckCircle2 size={17} /> Mark demonstration complete
              </Button>
            </div>
            <span className="session-note">The full timer is available; judges may mark the reviewed demonstration complete without waiting.</span>
          </div>
        </section>

        <section id="reflection" className="reflection-grid">
          <div className="section-card observation-panel">
            <div className="section-heading"><div><span className="eyebrow">03 · Reflection</span><h2>Record the observation.</h2></div><Clipboard size={21} /></div>
            <label htmlFor="observation">Fictional post-session observation</label>
            <Textarea id="observation" value={state.observationInput} onChange={(event) => store.setObservationInput(event.target.value)} placeholder="Record only what was directly noticed…" disabled={state.sessionStage !== "complete"} maxLength={500} />
            <div className="input-meta"><button type="button" onClick={() => store.setObservationInput(DEMO_OBSERVATION)} disabled={state.sessionStage !== "complete"}>Use fictional sample</button><span>{state.observationInput.length}/500</span></div>
            <Button onClick={() => void runTool("draft_observation", { observation: state.observationInput })} disabled={state.sessionStage !== "complete" || state.observationInput.trim().length < 12}>
              <FileCheck2 size={17} /> Draft structured review
            </Button>
          </div>

          <div className="section-card review-panel">
            <div className="section-heading"><div><span className="eyebrow">Visible review draft</span><h2>Separate data from meaning.</h2></div><span className="draft-state">{state.savedObservation ? "Saved in demo" : state.draft ? "Not saved" : "Awaiting draft"}</span></div>
            {state.draft ? (
              <div className="draft-fields">
                <div><span>Observed</span><p>{state.draft.observed}</p></div>
                <div><span>Interpretation</span><p>{state.draft.interpretation}</p></div>
                <div><span>Uncertainty</span><p>{state.draft.uncertainty}</p></div>
                <div><span>Next test</span><p>{state.draft.nextTest}</p></div>
              </div>
            ) : <div className="review-empty"><Waves size={28} /><p>The agent or visible fallback action will place a structured review here.</p></div>}
            <label className={`confirmation-gate ${state.saveConfirmation.consumed ? "is-consumed" : ""}`}>
              <input type="checkbox" checked={state.saveConfirmation.armed} onChange={(event) => store.setSaveConfirmation(event.target.checked)} disabled={!state.draft || state.saveConfirmation.consumed} />
              <span className="confirmation-box"><Check size={14} /></span>
              <span><strong>{state.saveConfirmation.consumed ? "Save permission consumed" : "I confirm this fictional draft may be saved"}</strong><small>Page-held, deliberate and valid for one successful save only.</small></span>
            </label>
            <Button className="amber-button" onClick={() => void runTool("save_confirmed_observation")} disabled={!state.draft || state.saveConfirmation.consumed}><LockKeyhole size={16} /> Save confirmed observation</Button>
          </div>
        </section>

        <section id="scoring" className="section-card scoring-section">
          <div className="section-heading"><div><span className="eyebrow">04 · Blinded scoring</span><h2>Score the outcome, not the story.</h2></div><span className="blind-chip"><EyeOff size={14} /> Assignment inaccessible</span></div>
          <p className="section-intro">The hidden experimental assignment is absent from the tool layer and page source. Judge only the recorded review.</p>
          <div className="score-grid">
            <ScoreControl label="Usefulness" value={state.scoresInput.usefulness} onChange={(value) => updateScore("usefulness", value)} description="Could this observation support a concrete next step?" />
            <ScoreControl label="Novelty" value={state.scoresInput.novelty} onChange={(value) => updateScore("novelty", value)} description="Does it add something not already obvious beforehand?" />
            <ScoreControl label="Testability" value={state.scoresInput.testability} onChange={(value) => updateScore("testability", value)} description="Can a future outcome check whether it helped?" />
          </div>
          <div className="score-footer">
            <label className={`confirmation-gate confirmation-gate--inline ${state.scoreConfirmation.consumed ? "is-consumed" : ""}`}>
              <input type="checkbox" checked={state.scoreConfirmation.armed} onChange={(event) => store.setScoreConfirmation(event.target.checked)} disabled={!state.savedObservation || state.scoreConfirmation.consumed} />
              <span className="confirmation-box"><Check size={14} /></span>
              <span><strong>{state.scoreConfirmation.consumed ? "Score permission consumed" : "I confirm these scores may be recorded"}</strong><small>One successful execution; no unblinding.</small></span>
            </label>
            <Button className="amber-button" onClick={() => void runTool("score_blinded_outcome", { ...state.scoresInput, rationale: "Fictional judge demonstration scores." })} disabled={!state.savedObservation || state.scoreConfirmation.consumed}><Gauge size={17} /> Record scores</Button>
          </div>
        </section>

        <section id="signal" className="signal-section">
          <div className="section-heading signal-heading">
            <div><span className="eyebrow">05 · Aggregate signal</span><h2>Describe the pattern.<br />Protect the inference.</h2></div>
            <div className="signal-actions"><Button variant="outline" onClick={() => void runTool("analyse_personal_signal")}><Activity size={16} /> Analyse personal signal</Button><Button onClick={() => void runTool("compare_collective_signal", { minimumSample })}><BarChart3 size={16} /> Compare Global Signal</Button></div>
          </div>
          <div className="signal-grid">
            <article className="signal-card personal-signal">
              <div className="signal-card__top"><div><span className="eyebrow">Personal Signal</span><h3>Six-session trajectory</h3></div><span className="metric-chip">n = {HISTORICAL_SESSIONS.length}</span></div>
              <div className="sparkline" aria-label="Fictional clarity rises from 2.4 to 3.8">{HISTORICAL_SESSIONS.map((session) => <span key={session.day} style={{ height: `${session.clarity * 18}%` }} title={`Day ${session.day}: ${session.clarity}`} />)}</div>
              <div className="signal-metrics">{Object.entries(personalAverages).map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
              <p>A small fictional history can describe a pattern; it cannot establish efficacy or causation.</p>
            </article>
            <article className="signal-card global-signal">
              <div className="collective-art" aria-hidden="true"><span /><i /><b /></div>
              <div className="signal-card__content">
                <div className="signal-card__top"><div><span className="eyebrow">Global Signal</span><h3>Threshold-gated comparison</h3></div><span className={`threshold-state ${thresholdMet ? "is-met" : ""}`}>{thresholdMet ? "Threshold met" : "Suppressed"}</span></div>
                <label className="threshold-control"><span>Minimum fictional cohort</span><input type="number" min={20} max={100} value={minimumSample} onChange={(event) => setMinimumSample(Number(event.target.value))} /></label>
                <div className="threshold-meter"><span style={{ width: `${Math.min((COHORT_SIGNAL.sessions / Math.max(minimumSample, 1)) * 100, 100)}%` }} /></div>
                <div className="threshold-copy"><strong>{COHORT_SIGNAL.sessions} available</strong><span>{minimumSample} required</span></div>
                {thresholdMet ? (
                  <div className="comparison-bars">{Object.entries(COHORT_SIGNAL.averages).map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${(value / 5) * 100}%` }} /></i><strong>{value}</strong></div>)}</div>
                ) : <div className="suppressed-state"><LockKeyhole size={19} /> Aggregate values remain hidden below the selected threshold.</div>}
              </div>
            </article>
          </div>
        </section>

        <section id="safety" className="safety-section section-card">
          <div className="section-heading"><div><span className="eyebrow">06 · Safety, privacy and evidence</span><h2>Educational training, not treatment.</h2></div><ShieldCheck size={25} /></div>
          <div className="safety-grid">
            <div><LockKeyhole size={18} /><h3>Production isolated</h3><p>No authentication, payments, production APIs, databases or customer records.</p></div>
            <div><EyeOff size={18} /><h3>Blinding preserved</h3><p>The assignment is not stored in accessible application state or returned by a tool.</p></div>
            <div><FlaskConical size={18} /><h3>Fiction only</h3><p>Alex, every score and all 48 cohort sessions are fixed fictional demonstration data.</p></div>
            <div><BookOpen size={18} /><h3>Evidence calibrated</h3><p>Subjective observations support self-tracking, not claims of efficacy or external intelligence.</p></div>
          </div>
          <div className="research-list">{RESEARCH_ANCHORS.map((anchor) => <a href={anchor.href} target="_blank" rel="noreferrer" key={anchor.label}><span>{anchor.label}</span><p>{anchor.detail}</p><ArrowRight size={15} /></a>)}</div>
          <div className="stop-rule"><strong>Stop rule</strong><p>Stop and re-ground if distress, panic, unreality or functional disruption appears. Seek qualified support when appropriate.</p></div>
        </section>

        <section className="tool-inventory section-card">
          <div className="section-heading"><div><span className="eyebrow">Registered at the top-level page</span><h2>Exactly eight site tools.</h2></div><span className="tool-count">8 / 8</span></div>
          <div className="tool-grid">{tools.map((tool) => (
            <button key={tool.name} type="button" onClick={() => {
              if (tool.name === "prepare_session") void runTool(tool.name, { durationMinutes: 3 });
              else if (tool.name === "draft_observation") void runTool(tool.name, { observation: state.observationInput || DEMO_OBSERVATION });
              else if (tool.name === "score_blinded_outcome") void runTool(tool.name, { ...state.scoresInput });
              else if (tool.name === "compare_collective_signal") void runTool(tool.name, { minimumSample });
              else void runTool(tool.name);
            }}><span className="mono">{tool.name}</span><small>{READ_ONLY_TOOL_NAMES.includes(tool.name) ? "READ ONLY" : "VISIBLE STATE"}</small></button>
          ))}</div>
        </section>

        <footer><BrandMark className="footer-mark" /><div><strong>Infinite Awareness · Judge Sandbox</strong><span>Standalone · Fiction only · No production connection</span></div><Button variant="outline" onClick={resetDemo}><RefreshCcw size={15} /> Reset for next judge</Button></footer>
      </main>

      <ToolResultDock result={toolResult} support={webMcpSupport} registeredCount={registeredCount} />
    </div>
  );
}
