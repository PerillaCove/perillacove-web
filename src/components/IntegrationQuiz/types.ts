export const DOMAIN_ORDER = [
  "nourishment",
  "craft",
  "body",
  "perception",
  "relationships",
  "money",
  "environment",
] as const;

export type DomainId = (typeof DOMAIN_ORDER)[number];

export const DOMAIN_LABELS: Record<DomainId, string> = {
  nourishment: "Nourishment",
  craft: "Craft",
  body: "Body",
  perception: "Perception",
  relationships: "Relationships",
  money: "Money",
  environment: "Environment",
};

export const RESPONSE_MIN = 1;
export const RESPONSE_MAX = 7;
export const TOTAL_QUESTIONS = 24;

export type QuizLayer = 1 | 2;
export type QuestionId = `Q${number}`;
export type QuizInputType = "boxes" | "slider" | "scenarios" | "wordSpectrum";

export interface QuizQuestionCore {
  id: QuestionId;
  prompt: string;
  probe: string;
}

export interface BoxesQuestionInput {
  inputType: "boxes";
}

export interface SliderQuestionInput {
  inputType: "slider";
  poles: {
    left: string;
    right: string;
  };
}

export interface ScenariosQuestionInput {
  inputType: "scenarios";
  scenarios: {
    a: string;
    b: string;
  };
}

export interface WordSpectrumQuestionInput {
  inputType: "wordSpectrum";
  words: [string, string, string, string, string];
  label?: string;
}

export type QuizQuestionInput =
  | BoxesQuestionInput
  | SliderQuestionInput
  | ScenariosQuestionInput
  | WordSpectrumQuestionInput;

export type Layer1QuizQuestion = QuizQuestionCore &
  QuizQuestionInput & {
    layer: 1;
    domain: DomainId;
  };

export type Layer2QuizQuestion = QuizQuestionCore &
  QuizQuestionInput & {
    layer: 2;
    pair: readonly [DomainId, DomainId];
  };

export type QuizQuestion = Layer1QuizQuestion | Layer2QuizQuestion;

export type QuizAnswers = Partial<Record<QuestionId, number>>;
export type CompleteQuizAnswers = Record<QuestionId, number>;

export interface DomainScoreSet {
  raw: Record<DomainId, number>;
  normalized: Record<DomainId, number>;
}

export interface IntegrationMetrics {
  mean: number;
  standardDeviation: number;
  cv: number;
  integration: number;
}

export interface QuizResult {
  layer1: DomainScoreSet;
  layer2: DomainScoreSet;
  layer2QuestionScores: Record<QuestionId, number>;
  integration: {
    internal: IntegrationMetrics;
    crossDomain: IntegrationMetrics;
    overall: number;
  };
}

export interface InternalGapCallout {
  domain: DomainId;
  score: number;
  message: string;
}

export interface CrossDomainDisconnectCallout {
  questionId: QuestionId;
  pair: readonly [DomainId, DomainId];
  score: number;
  message: string;
}

export interface IntegrationOutlierCallout {
  domain: DomainId;
  layer: QuizLayer;
  score: number;
  deviation: number;
  direction: "higher" | "lower";
  message: string;
}

export interface FractureCallouts {
  biggestInternalGap: InternalGapCallout;
  biggestCrossDomainDisconnect: CrossDomainDisconnectCallout;
  integrationOutlier: IntegrationOutlierCallout;
}
