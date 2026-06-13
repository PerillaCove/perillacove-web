import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import IntegrationRadarChart from "./IntegrationRadarChart";
import IntegrationRadarPreview from "./IntegrationRadarPreview";
import { QUESTIONS, SCALE_OPTIONS } from "./questions";
import { computeQuizResult } from "./scoring";
import { computeFractureCallouts } from "./analysis";
import { getIntegrationReading } from "./copy";
import {
  SCENARIO_INTENSITIES,
  decodeScenarioValue,
  getWordSpectrumIndex,
  getWordSpectrumValue,
  mapScenarioSelectionToValue,
  type ScenarioSide,
} from "./responseMapping";
import { getRadarPalette } from "./radarPalette";
import { DOMAIN_LABELS, type DomainId } from "./types";
import { useCircadianTheme } from "../../util/hooks/general";
import { HelpModalVisibleAtom, IntegrationQuizSessionAtom } from "../../state";

const AUTO_ADVANCE_DELAY_MS = 420;
const SHARED_TONE = {
  dark: {
    actionBase: "bg-slate-700 border-slate-600 text-slate-100",
    actionDisabled:
      "disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-400",
    numberBase: "bg-slate-700 text-slate-100",
    numberIdleBorder: "border-slate-600",
    numberSelected:
      "border-slate-300 text-slate-50 shadow-inner ring-1 ring-slate-200/35",
    progressFill: "bg-slate-700",
  },
  light: {
    actionBase: "bg-slate-300 border-slate-400 text-slate-900",
    actionDisabled:
      "disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-500",
    numberBase: "bg-slate-300 text-slate-800",
    numberIdleBorder: "border-slate-400",
    numberSelected:
      "border-slate-700 text-slate-900 shadow-inner ring-1 ring-slate-500/35",
    progressFill: "bg-slate-400",
  },
} as const;

const SAMPLE_LAYER_1_SCORES: Record<DomainId, number> = {
  nourishment: 9.3,
  craft: 2.2,
  body: 7.8,
  perception: 9.0,
  relationships: 3.1,
  money: 1.7,
  environment: 8.6,
};

const SAMPLE_LAYER_2_SCORES: Record<DomainId, number> = {
  nourishment: 2.8,
  craft: 8.7,
  body: 3.4,
  perception: 6.1,
  relationships: 8.2,
  money: 2.1,
  environment: 5.0,
};

type IntegrationBand = "high" | "medium" | "low";

function getIntegrationBand(score: number): IntegrationBand {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

function getIntegrationTone(
  score: number,
  isDarkMode: boolean,
): {
  cardClass: string;
  scoreClass: string;
} {
  const band = getIntegrationBand(score);

  if (band === "high") {
    return {
      cardClass: isDarkMode
        ? "border-emerald-400/35 bg-emerald-950/30"
        : "border-emerald-300 bg-emerald-50/85",
      scoreClass: isDarkMode ? "text-emerald-100" : "text-emerald-700",
    };
  }

  if (band === "medium") {
    return {
      cardClass: isDarkMode
        ? "border-amber-400/35 bg-amber-950/30"
        : "border-amber-300 bg-amber-50/85",
      scoreClass: isDarkMode ? "text-amber-100" : "text-amber-700",
    };
  }

  return {
    cardClass: isDarkMode
      ? "border-rose-400/35 bg-rose-950/30"
      : "border-rose-300 bg-rose-50/85",
    scoreClass: isDarkMode ? "text-rose-100" : "text-rose-700",
  };
}

function formatScore(value: number): string {
  return value.toFixed(1);
}

export default function IntegrationQuizPage() {
  const { isDarkMode } = useCircadianTheme();
  const sharedTone = isDarkMode ? SHARED_TONE.dark : SHARED_TONE.light;
  const radarPalette = getRadarPalette(isDarkMode);
  const [session, setSession] = useAtom(IntegrationQuizSessionAtom);
  const setIsHelpModalVisible = useSetAtom(HelpModalVisibleAtom);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const [scenarioSideDraft, setScenarioSideDraft] =
    useState<ScenarioSide | null>(null);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = QUESTIONS[session.currentQuestionIndex];
  const currentQuestionId = currentQuestion?.id;
  const currentQuestionInputType = currentQuestion?.inputType;
  const answeredCount = Object.keys(session.answers).length;
  const currentAnswer = currentQuestion
    ? session.answers[currentQuestion.id]
    : undefined;

  const clearAutoAdvanceTimeout = () => {
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAutoAdvanceTimeout();
    };
  }, []);

  useEffect(() => {
    if (currentQuestionInputType !== "scenarios") {
      setScenarioSideDraft(null);
      return;
    }

    const decoded = decodeScenarioValue(currentAnswer);
    setScenarioSideDraft(decoded?.side ?? null);
  }, [currentQuestionId, currentQuestionInputType, currentAnswer]);

  const result = useMemo(() => {
    if (!session.isComplete) {
      return null;
    }

    try {
      return computeQuizResult(session.answers);
    } catch {
      return null;
    }
  }, [session.answers, session.isComplete]);

  const callouts = useMemo(() => {
    if (!result) {
      return null;
    }

    return computeFractureCallouts(result);
  }, [result]);

  const integrationReading = result
    ? getIntegrationReading(result.integration.overall)
    : null;
  const integrationTone = result
    ? getIntegrationTone(result.integration.overall, isDarkMode)
    : null;

  const advanceToNext = () => {
    setSession((prev) => {
      const question = QUESTIONS[prev.currentQuestionIndex];
      if (!question || prev.answers[question.id] === undefined) {
        return prev;
      }

      const isLastQuestion = prev.currentQuestionIndex >= totalQuestions - 1;

      if (isLastQuestion) {
        return {
          ...prev,
          isComplete: true,
          currentQuestionIndex: totalQuestions - 1,
        };
      }

      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      };
    });
  };

  const scheduleAutoAdvance = () => {
    clearAutoAdvanceTimeout();
    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      advanceToNext();
    }, AUTO_ADVANCE_DELAY_MS);
  };

  const startQuiz = () => {
    clearAutoAdvanceTimeout();
    setSession((prev) => ({
      ...prev,
      started: true,
    }));
  };

  const setAnswerForCurrentQuestion = (value: number) => {
    if (!currentQuestion) {
      return;
    }

    setSession((prev) => ({
      ...prev,
      started: true,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: value,
      },
    }));
  };

  const clearAnswerForCurrentQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    clearAutoAdvanceTimeout();
    setSession((prev) => {
      if (!(currentQuestion.id in prev.answers)) {
        return prev;
      }

      const nextAnswers = { ...prev.answers };
      delete nextAnswers[currentQuestion.id];

      return {
        ...prev,
        started: true,
        answers: nextAnswers,
      };
    });
  };

  const selectDiscreteAnswer = (value: number) => {
    setAnswerForCurrentQuestion(value);
    scheduleAutoAdvance();
  };

  const setContinuousAnswer = (value: number) => {
    clearAutoAdvanceTimeout();
    setAnswerForCurrentQuestion(value);
  };

  const commitSliderAnswer = (value: number) => {
    setAnswerForCurrentQuestion(value);
    scheduleAutoAdvance();
  };

  const selectScenarioSide = (side: ScenarioSide) => {
    if (!currentQuestion || currentQuestion.inputType !== "scenarios") {
      return;
    }

    const decoded = decodeScenarioValue(currentAnswer);
    if (decoded && decoded.side !== side) {
      clearAnswerForCurrentQuestion();
    }

    setScenarioSideDraft(side);
  };

  const selectScenarioIntensity = (
    intensity: (typeof SCENARIO_INTENSITIES)[number],
  ) => {
    if (
      !currentQuestion ||
      currentQuestion.inputType !== "scenarios" ||
      !scenarioSideDraft
    ) {
      return;
    }

    selectDiscreteAnswer(
      mapScenarioSelectionToValue(scenarioSideDraft, intensity),
    );
  };

  const goPrevious = () => {
    clearAutoAdvanceTimeout();
    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  };

  const goNext = () => {
    clearAutoAdvanceTimeout();
    advanceToNext();
  };

  const restartQuiz = () => {
    clearAutoAdvanceTimeout();
    setSession(RESET);
  };

  const isLastQuestion = session.currentQuestionIndex === totalQuestions - 1;
  const hasProgress =
    session.started || answeredCount > 0 || session.isComplete;
  const decodedScenarioAnswer =
    currentQuestion?.inputType === "scenarios"
      ? decodeScenarioValue(currentAnswer)
      : null;
  const activeScenarioSide =
    currentQuestion?.inputType === "scenarios" ? scenarioSideDraft : null;
  const selectedScenarioIntensity =
    decodedScenarioAnswer &&
    activeScenarioSide &&
    decodedScenarioAnswer.side === activeScenarioSide
      ? decodedScenarioAnswer.intensity
      : null;
  const selectedWordIndex =
    currentQuestion?.inputType === "wordSpectrum" && currentAnswer !== undefined
      ? getWordSpectrumIndex(currentAnswer)
      : null;
  const sliderValue =
    currentQuestion?.inputType === "slider" ? (currentAnswer ?? 4) : 4;
  const sliderPercent = ((sliderValue - 1) / 6) * 100;
  const shouldUseInputCardFrame =
    currentQuestion?.inputType === "boxes" ||
    currentQuestion?.inputType === "slider";

  const topButtonClass = clsx(
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
    isDarkMode
      ? "border-[rgba(124,132,145,0.38)] bg-[rgba(10,16,27,0.66)] text-[rgba(208,216,227,0.95)] hover:bg-[rgba(14,21,34,0.8)]"
      : "border-slate-300 bg-white/80 text-slate-700 hover:bg-white",
  );

  const shellClass = clsx(
    "rounded-[28px] border p-4 sm:p-8",
    isDarkMode
      ? "border-[rgba(118,126,139,0.34)] bg-[linear-gradient(140deg,rgba(32,38,48,0.8),rgba(23,29,39,0.82),rgba(19,25,36,0.84))] shadow-[0_22px_68px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]"
      : "border-slate-300/70 bg-white/82 shadow-[0_24px_56px_rgba(15,23,42,0.12)]",
  );

  const primaryButtonClass = clsx(
    "rounded-full border px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed",
    "hover:brightness-105 disabled:opacity-100",
    sharedTone.actionBase,
    sharedTone.actionDisabled,
  );

  return (
    <div
      className={clsx(
        "relative min-h-dvh w-full overflow-y-auto px-4 pb-14 pt-[calc(env(safe-area-inset-top)+4rem)] sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+4.5rem)]",
        "bg-slate-50 dark:bg-[#0a0f1a]",
        isDarkMode ? "text-[rgba(206,214,226,0.94)]" : "text-slate-900",
      )}
    >
      <main className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-6 flex justify-end">
          {hasProgress ? (
            <button
              type="button"
              onClick={restartQuiz}
              className={clsx(
                topButtonClass,
                isDarkMode
                  ? "border-[rgba(146,130,109,0.48)] bg-[rgba(52,40,24,0.58)] text-[rgba(220,202,174,0.95)] hover:bg-[rgba(66,51,31,0.72)]"
                  : "border-amber-300/75 bg-amber-100/85 text-amber-800 hover:bg-amber-100",
              )}
            >
              Restart
            </button>
          ) : null}
        </div>

        {!session.started ? (
          <section
            className={clsx(
              "mx-auto max-w-4xl rounded-[34px] px-5 py-10 text-center sm:px-10 sm:py-12 flex-col items-center justify-center space-y-6",
            )}
          >
            <h1 className="mt-4 font-cormorant-garamond text-5xl lg:text-7xl font-semibold leading-[0.95] tracking-[-0.02em]">
              <span
                className={
                  isDarkMode ? "text-[rgb(217,224,234)]" : "text-slate-900"
                }
              >
                Are You{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(115deg, ${radarPalette.crossDomainStroke}, ${radarPalette.internalStroke})`,
                  }}
                >
                  Integrated
                </span>
                ?
              </span>
            </h1>
            <div className="mx-auto w-full max-w-4xl mt-4 lg:mt-0">
              <IntegrationRadarPreview
                layer1Scores={SAMPLE_LAYER_1_SCORES}
                layer2Scores={SAMPLE_LAYER_2_SCORES}
                isDarkMode={isDarkMode}
              />
            </div>

            <button
              type="button"
              onClick={startQuiz}
              className={clsx(
                "mt-10 text-2xl font-semibold cursor-pointer text-slate-300 hover:text-slate-200",
              )}
            >
              <span>Begin</span>
              <i className="fa-solid fa-arrow-right ml-2 text-lg"></i>
            </button>
          </section>
        ) : null}

        {session.started && !session.isComplete && currentQuestion ? (
          <section className={shellClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={clsx(
                  "text-sm font-semibold uppercase tracking-[0.2em]",
                  isDarkMode
                    ? "text-[rgba(192,201,214,0.94)]"
                    : "text-slate-600",
                )}
              >
                {currentQuestion.layer === 1
                  ? "Internal Integration"
                  : "Cross-Domain Integration"}
              </p>
              <p
                className={clsx(
                  "text-xl font-semibold uppercase tracking-[0.16em]",
                  isDarkMode ? "text-slate-300" : "text-slate-500",
                )}
              >
                {session.currentQuestionIndex + 1} / {totalQuestions}
              </p>
            </div>

            <div
              className={clsx(
                "mt-4 h-2.5 w-full overflow-hidden rounded-full",
                isDarkMode ? "bg-[rgba(88,100,119,0.44)]" : "bg-slate-200",
              )}
            >
              <div
                className={clsx(
                  "h-full transition-all duration-300 bg-slate-400 dark:bg-slate-400",
                )}
                style={{
                  width: `${((session.currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            <h2
              className={clsx(
                "mt-7 max-w-[40ch] font-cormorant-garamond text-[clamp(1.45rem,2.15vw,2.3rem)] font-semibold leading-[1.14] tracking-[-0.008em]",
                isDarkMode ? "text-[rgb(217,224,233)]" : "text-slate-900",
              )}
            >
              {currentQuestion.prompt}
            </h2>

            <div
              className={clsx(
                "mt-6 sm:mt-7",
                shouldUseInputCardFrame && "rounded-2xl border p-3.5 sm:p-5",
                shouldUseInputCardFrame &&
                  (isDarkMode
                    ? "border-[rgba(118,126,139,0.34)] bg-[linear-gradient(140deg,rgba(29,35,46,0.76),rgba(21,27,38,0.78),rgba(17,23,33,0.8))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-slate-300/80 bg-slate-50/95"),
              )}
            >
              {currentQuestion.inputType === "boxes" ? (
                <>
                  <div className="mb-4 flex items-start justify-between gap-4 text-sm sm:text-base">
                    <p
                      className={
                        isDarkMode
                          ? "max-w-[48%] text-[rgba(197,206,218,0.93)]"
                          : "max-w-[48%] text-slate-700"
                      }
                    >
                      <span className="font-semibold">1</span> = NO
                    </p>
                    <p
                      className={
                        isDarkMode
                          ? "max-w-[48%] text-right text-[rgba(197,206,218,0.93)]"
                          : "max-w-[48%] text-right text-slate-700"
                      }
                    >
                      <span className="font-semibold">7</span> = YES
                    </p>
                  </div>

                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {SCALE_OPTIONS.map((value) => {
                      const isSelected = currentAnswer === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => selectDiscreteAnswer(value)}
                          className={clsx(
                            "rounded-xl border py-2.5 text-base font-semibold transition-colors sm:py-3 sm:text-lg",
                            sharedTone.numberBase,
                            isSelected
                              ? sharedTone.numberSelected
                              : clsx(
                                  sharedTone.numberIdleBorder,
                                  "hover:brightness-105",
                                ),
                          )}
                          aria-pressed={isSelected}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {currentQuestion.inputType === "slider" ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:mb-5 sm:gap-4 sm:text-base lg:text-xl">
                    <p
                      className={clsx(
                        "leading-snug sm:font-medium",
                        isDarkMode
                          ? "text-[rgba(197,206,218,0.93)]"
                          : "text-slate-700",
                      )}
                    >
                      {currentQuestion.poles.left}
                    </p>
                    <p
                      className={clsx(
                        "text-right leading-snug sm:font-medium",
                        isDarkMode
                          ? "text-[rgba(197,206,218,0.93)]"
                          : "text-slate-700",
                      )}
                    >
                      {currentQuestion.poles.right}
                    </p>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={0.01}
                    value={sliderValue}
                    aria-label={`${currentQuestion.id} slider response`}
                    onChange={(event) =>
                      setContinuousAnswer(Number(event.currentTarget.value))
                    }
                    onPointerUp={(event) =>
                      commitSliderAnswer(Number(event.currentTarget.value))
                    }
                    className={clsx(
                      "w-full cursor-pointer appearance-none rounded-full h-2.5",
                      isDarkMode ? "bg-slate-700" : "bg-slate-300",
                    )}
                    style={{
                      background: isDarkMode
                        ? `linear-gradient(to right, rgb(148 163 184) 0%, rgb(148 163 184) ${sliderPercent}%, rgb(51 65 85) ${sliderPercent}%, rgb(51 65 85) 100%)`
                        : `linear-gradient(to right, rgb(71 85 105) 0%, rgb(71 85 105) ${sliderPercent}%, rgb(203 213 225) ${sliderPercent}%, rgb(203 213 225) 100%)`,
                    }}
                  />
                </>
              ) : null}

              {currentQuestion.inputType === "scenarios" ? (
                <div className="space-y-2.5 sm:space-y-4">
                  <button
                    type="button"
                    onClick={() => selectScenarioSide("a")}
                    className={clsx(
                      "w-full rounded-xl border p-4 text-left text-[1rem] leading-[1.35] transition-colors sm:p-5 sm:text-lg sm:leading-relaxed lg:p-6 lg:text-xl",
                      isDarkMode
                        ? "bg-slate-800/65 text-slate-200"
                        : "bg-white text-slate-800",
                      activeScenarioSide === "a"
                        ? isDarkMode
                          ? "border-slate-200 ring-1 ring-slate-200/40"
                          : "border-slate-700 ring-1 ring-slate-500/35"
                        : isDarkMode
                          ? "border-slate-600 hover:bg-slate-700/70"
                          : "border-slate-300 hover:bg-slate-50",
                    )}
                    aria-pressed={activeScenarioSide === "a"}
                  >
                    {currentQuestion.scenarios.a}
                  </button>

                  <button
                    type="button"
                    onClick={() => selectScenarioSide("b")}
                    className={clsx(
                      "w-full rounded-xl border p-4 text-left text-[1rem] leading-[1.35] transition-colors sm:p-5 sm:text-lg sm:leading-relaxed lg:p-6 lg:text-xl",
                      isDarkMode
                        ? "bg-slate-800/65 text-slate-200"
                        : "bg-white text-slate-800",
                      activeScenarioSide === "b"
                        ? isDarkMode
                          ? "border-slate-200 ring-1 ring-slate-200/40"
                          : "border-slate-700 ring-1 ring-slate-500/35"
                        : isDarkMode
                          ? "border-slate-600 hover:bg-slate-700/70"
                          : "border-slate-300 hover:bg-slate-50",
                    )}
                    aria-pressed={activeScenarioSide === "b"}
                  >
                    {currentQuestion.scenarios.b}
                  </button>

                  {activeScenarioSide ? (
                    <div>
                      <p
                        className={clsx(
                          "text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm sm:tracking-[0.14em]",
                          isDarkMode ? "text-slate-300" : "text-slate-600",
                        )}
                      >
                        How much?
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                        {SCENARIO_INTENSITIES.map((intensity) => {
                          const isSelected =
                            selectedScenarioIntensity === intensity;
                          return (
                            <button
                              key={intensity}
                              type="button"
                              onClick={() => selectScenarioIntensity(intensity)}
                              className={clsx(
                                "rounded-xl border min-w-0 px-1 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.01em] leading-tight whitespace-nowrap transition-colors sm:px-2 sm:py-3 sm:text-sm sm:tracking-[0.08em]",
                                sharedTone.numberBase,
                                isSelected
                                  ? sharedTone.numberSelected
                                  : clsx(
                                      sharedTone.numberIdleBorder,
                                      "hover:brightness-105",
                                    ),
                              )}
                              aria-pressed={isSelected}
                            >
                              {intensity}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentQuestion.inputType === "wordSpectrum" ? (
                <div className="space-y-3">
                  {currentQuestion.label ? (
                    <p
                      className={clsx(
                        "text-sm font-semibold",
                        isDarkMode
                          ? "text-[rgba(197,206,218,0.93)]"
                          : "text-slate-700",
                      )}
                    >
                      {currentQuestion.label}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    {currentQuestion.words.map((word, index) => {
                      const isSelected = selectedWordIndex === index;
                      return (
                        <button
                          key={word}
                          type="button"
                          onClick={() =>
                            selectDiscreteAnswer(getWordSpectrumValue(index))
                          }
                          className={clsx(
                            "rounded-xl border px-1.5 py-2.5 text-center text-[0.82rem] font-semibold leading-tight [overflow-wrap:anywhere] transition-colors sm:py-3 sm:text-base",
                            sharedTone.numberBase,
                            isSelected
                              ? sharedTone.numberSelected
                              : clsx(
                                  sharedTone.numberIdleBorder,
                                  "hover:brightness-105",
                                ),
                          )}
                          aria-pressed={isSelected}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={session.currentQuestionIndex === 0}
                className={clsx(
                  "rounded-full border px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                  isDarkMode
                    ? "border-[rgba(108,118,134,0.52)] bg-[rgba(14,20,30,0.6)] text-[rgba(200,208,220,0.94)] hover:bg-[rgba(22,29,41,0.86)]"
                    : "border-slate-300 text-slate-800 hover:bg-slate-100",
                )}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentAnswer === undefined}
                className={primaryButtonClass}
              >
                {isLastQuestion ? "See Results" : "Next"}
              </button>
            </div>
          </section>
        ) : null}

        {session.isComplete && result && callouts && integrationTone ? (
          <section className="space-y-5">
            <section className={shellClass}>
              <h2
                className={clsx(
                  "text-2xl font-semibold tracking-[0.08em] sm:text-3xl",
                  isDarkMode ? "text-[rgb(213,221,230)]" : "text-slate-800",
                )}
              >
                Your Integration Results
              </h2>
              <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center">
                <IntegrationRadarChart
                  layer1Scores={result.layer1.normalized}
                  layer2Scores={result.layer2.normalized}
                  isDarkMode={isDarkMode}
                  className="h-[360px] w-full flex-1 sm:h-[430px] lg:h-[520px]"
                />

                <aside
                  className={clsx(
                    "w-full rounded-2xl border p-5 sm:p-6 lg:max-w-[420px]",
                    integrationTone.cardClass,
                  )}
                >
                  <p
                    className={clsx(
                      "text-sm font-semibold uppercase tracking-[0.2em]",
                      isDarkMode ? "text-slate-100/90" : "text-slate-700",
                    )}
                  >
                    Score
                  </p>
                  <p
                    className={clsx(
                      "mt-2 text-5xl font-semibold sm:text-6xl",
                      integrationTone.scoreClass,
                    )}
                  >
                    {formatScore(result.integration.overall)} / 10
                  </p>
                  <p
                    className={clsx(
                      "mt-4 text-xl leading-relaxed",
                      isDarkMode ? "text-slate-100/90" : "text-slate-700",
                    )}
                  >
                    {integrationReading}
                  </p>
                </aside>
              </div>
            </section>

            <section className={shellClass}>
              <h3
                className={clsx(
                  "text-lg font-semibold uppercase tracking-[0.14em]",
                  isDarkMode ? "text-slate-300" : "text-slate-800",
                )}
              >
                Fragments
              </h3>

              <div className="mt-4 space-y-4">
                <article
                  className={clsx(
                    "rounded-2xl border p-4",
                    isDarkMode
                      ? "border-[rgba(118,126,139,0.32)] bg-[linear-gradient(145deg,rgba(31,37,47,0.72),rgba(23,29,39,0.76),rgba(18,24,34,0.78))]"
                      : "border-slate-300/80 bg-slate-50/90",
                  )}
                >
                  <p
                    className={clsx(
                      "text-xs font-semibold uppercase tracking-[0.15em]",
                      isDarkMode
                        ? "text-[rgba(175,187,203,0.9)]"
                        : "text-slate-500",
                    )}
                  >
                    Greatest Internal Fragmentation
                  </p>
                  <p
                    className={clsx(
                      "mt-1 text-xl font-semibold",
                      isDarkMode ? "text-[rgb(211,219,229)]" : "text-slate-800",
                    )}
                  >
                    {DOMAIN_LABELS[callouts.biggestInternalGap.domain]} ·{" "}
                    {formatScore(callouts.biggestInternalGap.score)}
                  </p>
                  <p
                    className={clsx(
                      "mt-2 text-lg leading-relaxed",
                      isDarkMode
                        ? "text-[rgba(194,203,215,0.9)]"
                        : "text-slate-700",
                    )}
                  >
                    {callouts.biggestInternalGap.message}
                  </p>
                </article>

                <article
                  className={clsx(
                    "rounded-2xl border p-4",
                    isDarkMode
                      ? "border-[rgba(118,126,139,0.32)] bg-[linear-gradient(145deg,rgba(31,37,47,0.72),rgba(23,29,39,0.76),rgba(18,24,34,0.78))]"
                      : "border-slate-300/80 bg-slate-50/90",
                  )}
                >
                  <p
                    className={clsx(
                      "text-xs font-semibold uppercase tracking-[0.15em]",
                      isDarkMode
                        ? "text-[rgba(175,187,203,0.9)]"
                        : "text-slate-500",
                    )}
                  >
                    Greatest Cross-Domain Fragmentation
                  </p>
                  <p
                    className={clsx(
                      "mt-1 text-xl font-semibold",
                      isDarkMode ? "text-[rgb(211,219,229)]" : "text-slate-800",
                    )}
                  >
                    {
                      DOMAIN_LABELS[
                        callouts.biggestCrossDomainDisconnect.pair[0]
                      ]
                    }{" "}
                    ×{" "}
                    {
                      DOMAIN_LABELS[
                        callouts.biggestCrossDomainDisconnect.pair[1]
                      ]
                    }{" "}
                    · {formatScore(callouts.biggestCrossDomainDisconnect.score)}{" "}
                    / 7
                  </p>
                  <p
                    className={clsx(
                      "mt-2 text-lg leading-relaxed",
                      isDarkMode
                        ? "text-[rgba(194,203,215,0.9)]"
                        : "text-slate-700",
                    )}
                  >
                    {callouts.biggestCrossDomainDisconnect.message}
                  </p>
                </article>

                <article
                  className={clsx(
                    "rounded-2xl border p-4",
                    isDarkMode
                      ? "border-[rgba(118,126,139,0.32)] bg-[linear-gradient(145deg,rgba(31,37,47,0.72),rgba(23,29,39,0.76),rgba(18,24,34,0.78))]"
                      : "border-slate-300/80 bg-slate-50/90",
                  )}
                >
                  <p
                    className={clsx(
                      "text-xs font-semibold uppercase tracking-[0.15em]",
                      isDarkMode
                        ? "text-[rgba(175,187,203,0.9)]"
                        : "text-slate-500",
                    )}
                  >
                    Outlier
                  </p>
                  <p
                    className={clsx(
                      "mt-1 text-xl font-semibold",
                      isDarkMode ? "text-[rgb(211,219,229)]" : "text-slate-800",
                    )}
                  >
                    {DOMAIN_LABELS[callouts.integrationOutlier.domain]} · Layer{" "}
                    {callouts.integrationOutlier.layer} ·{" "}
                    {formatScore(callouts.integrationOutlier.score)}
                  </p>
                  <p
                    className={clsx(
                      "mt-2 text-lg leading-relaxed",
                      isDarkMode
                        ? "text-[rgba(194,203,215,0.9)]"
                        : "text-slate-700",
                    )}
                  >
                    {callouts.integrationOutlier.message}
                  </p>
                </article>
              </div>
            </section>

            <section className={shellClass}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    className={clsx(
                      "text-lg font-semibold uppercase tracking-[0.14em]",
                      isDarkMode ? "text-slate-300" : "text-slate-800",
                    )}
                  >
                    Questions?
                  </h3>
                  <p
                    className={clsx(
                      "mt-2 text-lg leading-relaxed",
                      isDarkMode
                        ? "text-[rgba(194,203,215,0.9)]"
                        : "text-slate-700",
                    )}
                  >
                    If you have questions or information to share, contact me
                    directly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHelpModalVisible(true)}
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                    isDarkMode
                      ? "border-[rgba(118,126,139,0.45)] bg-[rgba(20,26,36,0.64)] text-[rgba(213,222,232,0.95)] hover:bg-[rgba(30,37,49,0.86)]"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                  )}
                >
                  Contact / Help
                  <span aria-hidden>→</span>
                </button>
              </div>
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}
