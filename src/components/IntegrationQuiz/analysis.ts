import {
  DOMAIN_ORDER,
  type IntegrationOutlierCallout,
  type CrossDomainDisconnectCallout,
  type DomainId,
  type FractureCallouts,
  type InternalGapCallout,
  type QuestionId,
  type QuizLayer,
  type QuizResult,
} from "./types";
import { LAYER_2_QUESTION_IDS, QUESTION_BY_ID } from "./questions";
import {
  getInternalGapMessage,
  getOutlierMessage,
  getPairDisconnectMessage,
} from "./copy";

interface OutlierCandidate {
  domain: DomainId;
  layer: QuizLayer;
  score: number;
  deviation: number;
}

function getDomainOrderIndex(domain: DomainId): number {
  return DOMAIN_ORDER.indexOf(domain);
}

export function findLowestLayer1Domain(result: QuizResult): InternalGapCallout {
  let lowestDomain: DomainId = DOMAIN_ORDER[0];
  let lowestScore = result.layer1.normalized[lowestDomain];

  for (const domain of DOMAIN_ORDER) {
    const score = result.layer1.normalized[domain];
    if (score < lowestScore) {
      lowestDomain = domain;
      lowestScore = score;
    }
  }

  return {
    domain: lowestDomain,
    score: lowestScore,
    message: getInternalGapMessage(lowestDomain),
  };
}

export function findLowestLayer2PairQuestion(
  result: QuizResult,
): CrossDomainDisconnectCallout {
  let lowestQuestionId = LAYER_2_QUESTION_IDS[0] as QuestionId;
  let lowestScore = result.layer2QuestionScores[lowestQuestionId] ?? Infinity;

  for (const questionId of LAYER_2_QUESTION_IDS) {
    const score = result.layer2QuestionScores[questionId] ?? Infinity;
    if (score < lowestScore) {
      lowestQuestionId = questionId;
      lowestScore = score;
    }
  }

  const question = QUESTION_BY_ID[lowestQuestionId];
  if (question.layer !== 2) {
    throw new Error(`Expected ${lowestQuestionId} to be a Layer 2 question.`);
  }

  return {
    questionId: lowestQuestionId,
    pair: question.pair,
    score: lowestScore,
    message: getPairDisconnectMessage(lowestQuestionId),
  };
}

export function findIntegrationOutlier(
  result: QuizResult,
): IntegrationOutlierCallout {
  const layer1Mean = result.integration.internal.mean;
  const layer2Mean = result.integration.crossDomain.mean;

  const candidates: OutlierCandidate[] = [];

  for (const domain of DOMAIN_ORDER) {
    const layer1Score = result.layer1.normalized[domain];
    const layer2Score = result.layer2.normalized[domain];

    candidates.push({
      domain,
      layer: 1,
      score: layer1Score,
      deviation: Math.abs(layer1Score - layer1Mean),
    });

    candidates.push({
      domain,
      layer: 2,
      score: layer2Score,
      deviation: Math.abs(layer2Score - layer2Mean),
    });
  }

  const sorted = [...candidates].sort((a, b) => {
    if (b.deviation !== a.deviation) {
      return b.deviation - a.deviation;
    }

    const domainDelta =
      getDomainOrderIndex(a.domain) - getDomainOrderIndex(b.domain);
    if (domainDelta !== 0) {
      return domainDelta;
    }

    return a.layer - b.layer;
  });

  const outlier = sorted[0];
  const layerMean = outlier.layer === 1 ? layer1Mean : layer2Mean;
  const direction: "higher" | "lower" =
    outlier.score >= layerMean ? "higher" : "lower";

  return {
    domain: outlier.domain,
    layer: outlier.layer,
    score: outlier.score,
    deviation: outlier.deviation,
    direction,
    message: getOutlierMessage(outlier.domain, outlier.layer, direction),
  };
}

export function computeFractureCallouts(result: QuizResult): FractureCallouts {
  return {
    biggestInternalGap: findLowestLayer1Domain(result),
    biggestCrossDomainDisconnect: findLowestLayer2PairQuestion(result),
    integrationOutlier: findIntegrationOutlier(result),
  };
}
