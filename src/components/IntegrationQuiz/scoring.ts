import {
  DOMAIN_ORDER,
  RESPONSE_MAX,
  RESPONSE_MIN,
  type CompleteQuizAnswers,
  type IntegrationMetrics,
  type DomainId,
  type DomainScoreSet,
  type QuestionId,
  type QuizAnswers,
  type QuizResult,
} from "./types";
import { isValidResponseValue } from "./responseMapping";
import {
  LAYER_1_DOMAIN_QUESTION_IDS,
  LAYER_2_DOMAIN_QUESTION_IDS,
  LAYER_2_QUESTION_IDS,
  QUESTION_IDS,
} from "./questions";

function average(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot average an empty list of values.");
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function createEmptyDomainRecord(): Record<DomainId, number> {
  return DOMAIN_ORDER.reduce(
    (record, domain) => {
      record[domain] = 0;
      return record;
    },
    {} as Record<DomainId, number>,
  );
}

export function normalizeRawAverage(rawAverage: number): number {
  return ((rawAverage - RESPONSE_MIN) / (RESPONSE_MAX - RESPONSE_MIN)) * 10;
}

export function assertCompleteAnswers(
  answers: QuizAnswers,
): asserts answers is CompleteQuizAnswers {
  const missingIds = QUESTION_IDS.filter(
    (id) => !isValidResponseValue(answers[id]),
  );

  if (missingIds.length > 0) {
    throw new Error(
      `Cannot score incomplete quiz answers. Missing or invalid: ${missingIds.join(", ")}`,
    );
  }
}

export function computeLayer1Scores(
  answers: CompleteQuizAnswers,
): DomainScoreSet {
  const raw = createEmptyDomainRecord();
  const normalized = createEmptyDomainRecord();

  for (const domain of DOMAIN_ORDER) {
    const questionIds = LAYER_1_DOMAIN_QUESTION_IDS[domain];
    const rawAverage = average(questionIds.map((id) => answers[id]));
    raw[domain] = rawAverage;
    normalized[domain] = normalizeRawAverage(rawAverage);
  }

  return { raw, normalized };
}

export function computeLayer2Scores(
  answers: CompleteQuizAnswers,
): DomainScoreSet {
  const raw = createEmptyDomainRecord();
  const normalized = createEmptyDomainRecord();

  for (const domain of DOMAIN_ORDER) {
    const questionIds = LAYER_2_DOMAIN_QUESTION_IDS[domain];
    const rawAverage = average(questionIds.map((id) => answers[id]));
    raw[domain] = rawAverage;
    normalized[domain] = normalizeRawAverage(rawAverage);
  }

  return { raw, normalized };
}

export function computeLayer2QuestionScores(
  answers: CompleteQuizAnswers,
): Record<QuestionId, number> {
  return LAYER_2_QUESTION_IDS.reduce(
    (record, id) => {
      record[id] = answers[id];
      return record;
    },
    {} as Record<QuestionId, number>,
  );
}

export function computeIntegration(
  scores: readonly number[],
): IntegrationMetrics {
  if (scores.length === 0) {
    throw new Error("Cannot compute integration for an empty score array.");
  }

  const mean = average(scores);
  const variance =
    scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);

  let cv: number;
  let integration: number;

  if (mean === 0) {
    if (standardDeviation === 0) {
      cv = 0;
      integration = 10;
    } else {
      cv = Number.POSITIVE_INFINITY;
      integration = 0;
    }
  } else {
    cv = standardDeviation / mean;
    integration = Math.max(0, 1 - cv) * 10;
  }

  return {
    mean,
    standardDeviation,
    cv,
    integration,
  };
}

export function computeQuizResult(answers: QuizAnswers): QuizResult {
  assertCompleteAnswers(answers);

  const layer1 = computeLayer1Scores(answers);
  const layer2 = computeLayer2Scores(answers);

  const internalIntegration = computeIntegration(
    DOMAIN_ORDER.map((domain) => layer1.normalized[domain]),
  );
  const crossDomainIntegration = computeIntegration(
    DOMAIN_ORDER.map((domain) => layer2.normalized[domain]),
  );

  return {
    layer1,
    layer2,
    layer2QuestionScores: computeLayer2QuestionScores(answers),
    integration: {
      internal: internalIntegration,
      crossDomain: crossDomainIntegration,
      overall:
        (internalIntegration.integration + crossDomainIntegration.integration) /
        2,
    },
  };
}
