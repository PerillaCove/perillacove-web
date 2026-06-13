import type {
  DomainId,
  Layer1QuizQuestion,
  Layer2QuizQuestion,
  QuestionId,
  QuizQuestion,
} from "./types";

export interface ResponseAnchors {
  min: string;
  max: string;
}

export const LAYER_1_RESPONSE_ANCHORS: ResponseAnchors = {
  min: "Fragmented",
  max: "Integrated",
};

export const LAYER_2_RESPONSE_ANCHORS: ResponseAnchors = {
  min: "Fragmented",
  max: "Integrated",
};

export const SCALE_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "Q1",
    layer: 1,
    domain: "nourishment",
    inputType: "slider",
    prompt:
      "The food that tastes best to me is also what my body runs best on.",
    probe:
      "Probes whether taste and health have collapsed into one list or remain split.",
    poles: {
      left: "NO",
      right: "YES",
    },
  },
  {
    id: "Q2",
    layer: 1,
    domain: "nourishment",
    inputType: "wordSpectrum",
    prompt:
      "Eating well is something that comes easily, not something requires discipline.",
    probe: "Probes flow versus management in nourishment behavior.",
    words: ["Not at all", "Somewhat", "Neutral", "Mostly", "Completely"],
  },
  {
    id: "Q3",
    layer: 1,
    domain: "craft",
    inputType: "boxes",
    prompt:
      "My work feels like play more often than it feels like something I have to push through.",
    probe: "Probes whether the work-versus-play split has dissolved.",
  },
  {
    id: "Q4",
    layer: 1,
    domain: "craft",
    inputType: "scenarios",
    prompt:
      "The thing I'd do for free happens to be the thing that builds my livelihood.",
    probe: "Probes alignment between passion and income.",
    scenarios: {
      a: "What I do to earn a living and what I'd do for free are different things.",
      b: "The thing I'd do for free is the thing building my livelihood. There's no split between earning and doing what I love.",
    },
  },
  {
    id: "Q5",
    layer: 1,
    domain: "body",
    inputType: "slider",
    prompt: "After rest, I feel genuinely energized — not just less tired.",
    probe: "Probes whether rest is generative instead of merely restorative.",
    poles: {
      left: "After rest I'm just less tired",
      right: "After rest I feel genuinely rejuvenated",
    },
  },
  {
    id: "Q6",
    layer: 1,
    domain: "body",
    inputType: "wordSpectrum",
    prompt:
      "Movement is something my body pulls me toward, not something I impose on it.",
    probe: "Probes desire-driven movement versus self-coercion.",
    words: ["Not at all", "Somewhat", "Neutral", "Mostly", "Completely"],
  },
  {
    id: "Q7",
    layer: 1,
    domain: "perception",
    inputType: "scenarios",
    prompt:
      "I see the true gears that are in play within institutions, media, and culture.",
    probe:
      "Probes integrated perception that stays clear without anxiety or cynicism.",
    scenarios: {
      a: "I find myself overanalyzing and second-guessing everything.",
      b: "I see the gears turning behind institutions, media, and culture clearly, and it doesn't make me anxious or cynical. I just see it.",
    },
  },
  {
    id: "Q8",
    layer: 1,
    domain: "perception",
    inputType: "boxes",
    prompt:
      "Cause and effect seem to be not linear but multi-dimensional, emergent, and shaped by context.",
    probe:
      "Probes precision with data and non-linear systems thinking in one move.",
  },
  {
    id: "Q9",
    layer: 1,
    domain: "relationships",
    inputType: "slider",
    prompt:
      "The people closest to me nourish me, and I don't maintain relationships out of obligation.",
    probe: "Probes nourishment versus duty in close relationships.",
    poles: {
      left: "I maintain most relationships out of obligation or history",
      right: "Every close relationship actively nourishes me",
    },
  },
  {
    id: "Q10",
    layer: 1,
    domain: "relationships",
    inputType: "boxes",
    prompt:
      "Time alone and time with others feed each other rather than compete.",
    probe: "Probes solitude-connection compounding versus tradeoff.",
  },
  {
    id: "Q11",
    layer: 1,
    domain: "money",
    inputType: "scenarios",
    prompt: "I spend and invest money in a way that is in line with my nature.",
    probe: "Probes whether financial philosophy is native or borrowed.",
    scenarios: {
      a: "I mostly follow conventional financial thinking — what experts recommend — even though it doesn't always feel like mine.",
      b: "How I spend and invest comes from the same instinct that drives the rest of my life. My financial moves feel like mine, not borrowed.",
    },
  },
  {
    id: "Q12",
    layer: 1,
    domain: "money",
    inputType: "slider",
    prompt:
      "I don't spend money compensating for things that are missing in my life.",
    probe: "Probes compensatory consumption as symptom of fragmentation.",
    poles: {
      left: "I often spend to fill a gap or compensate for something missing",
      right: "Almost nothing I buy is compensatory",
    },
  },
  {
    id: "Q13",
    layer: 1,
    domain: "environment",
    inputType: "scenarios",
    prompt:
      "Where I live — the city, the climate, the pace — actually fits how I want to spend my days, not just what seemed practical or expected.",
    probe: "Probes place integration versus practical-default mismatch.",
    scenarios: {
      a: "I ended up where I live for practical reasons — work, cost, family — and the place doesn't really match how I'd choose to spend my days.",
      b: "Where I live fits kindles my nature. The city, the climate, the pace — it's aligned, not just practical.",
    },
  },
  {
    id: "Q14",
    layer: 1,
    domain: "environment",
    inputType: "boxes",
    prompt:
      "The space I inhabit allows me to live and create with peace and freedom.",
    probe: "Probes lived spatial fit versus borrowed templates.",
  },
  {
    id: "Q15",
    layer: 2,
    pair: ["craft", "body"],
    inputType: "slider",
    prompt: "My work leaves my body feeling good, not depleted.",
    probe: "Probes whether craft and body reinforce or erode each other.",
    poles: {
      left: "My work depletes my body",
      right: "My work leaves my body feeling good",
    },
  },
  {
    id: "Q16",
    layer: 2,
    pair: ["craft", "money"],
    inputType: "boxes",
    prompt:
      "The way I earn money is a direct expression of my craft, not a compromise to fund it.",
    probe: "Probes whether earning is an expression of craft or a split.",
  },
  {
    id: "Q17",
    layer: 2,
    pair: ["nourishment", "perception"],
    inputType: "wordSpectrum",
    prompt: "I feel clarity after eating.",
    probe: "Probes whether nourishment and cognition compound.",
    label: "After eating, I typically feel...",
    words: ["Heavy", "Dull", "Neutral", "Clear", "Sharp"],
  },
  {
    id: "Q18",
    layer: 2,
    pair: ["body", "perception"],
    inputType: "boxes",
    prompt: "Physical movement de-clutters my mind and sharpens my thinking.",
    probe: "Probes body-mind coupling in lived practice.",
  },
  {
    id: "Q19",
    layer: 2,
    pair: ["relationships", "craft"],
    inputType: "slider",
    prompt:
      "The people in my life understand and energize my work, rather than pulling me away from it.",
    probe: "Probes whether social world and craft world collaborate.",
    poles: {
      left: "The people in my life pull me away from my work",
      right: "The people in my life energize my work",
    },
  },
  {
    id: "Q20",
    layer: 2,
    pair: ["money", "relationships"],
    inputType: "boxes",
    prompt:
      "Money doesn't create tension or power imbalance in my closest relationships.",
    probe:
      "Probes money-driven friction, hierarchy, and resentment in closeness.",
  },
  {
    id: "Q21",
    layer: 2,
    pair: ["nourishment", "relationships"],
    inputType: "wordSpectrum",
    prompt:
      "Sharing food and meals is a real point of connection in my relationships, not just logistics.",
    probe:
      "Probes whether meals function as social glue or mere fuel logistics.",
    label: "Sharing meals with people I'm close to feels...",
    words: ["Logistical", "Routine", "Pleasant", "Connecting", "Integrated"],
  },
  {
    id: "Q22",
    layer: 2,
    pair: ["money", "body"],
    inputType: "scenarios",
    prompt:
      "I'm not trading my well-being for income, and I'm not spending to fix health problems my lifestyle creates.",
    probe: "Probes the earn-by-burning then pay-to-repair cycle.",
    scenarios: {
      a: "I push hard to earn and it costs my body, and then I spend money fixing what the grind broke — gym memberships, supplements, recovery, stress relief.",
      b: "How I earn doesn't cost my health, and I'm not spending to repair damage from my own lifestyle.",
    },
  },
  {
    id: "Q23",
    layer: 2,
    pair: ["environment", "craft"],
    inputType: "boxes",
    prompt:
      "The place where I live and the space I work in feed my craft rather than being something I tolerate.",
    probe: "Probes whether setting amplifies craft versus being tolerated.",
  },
  {
    id: "Q24",
    layer: 2,
    pair: ["environment", "body"],
    inputType: "slider",
    prompt:
      "My surroundings naturally pull me into physical engagement — walking, fresh air, contact with weather and terrain.",
    probe: "Probes environment-body dialogue through movement and exposure.",
    poles: {
      left: "My environment keeps me sealed indoors",
      right:
        "My surroundings naturally pull me outside and into physical engagement",
    },
  },
] satisfies readonly QuizQuestion[];

export const QUESTION_IDS = QUESTIONS.map(
  (question) => question.id,
) as QuestionId[];

export const LAYER_1_QUESTIONS = QUESTIONS.filter(
  (question): question is Layer1QuizQuestion => question.layer === 1,
);

export const LAYER_2_QUESTIONS = QUESTIONS.filter(
  (question): question is Layer2QuizQuestion => question.layer === 2,
);

export const LAYER_1_QUESTION_IDS = LAYER_1_QUESTIONS.map(
  (question) => question.id,
) as QuestionId[];

export const LAYER_2_QUESTION_IDS = LAYER_2_QUESTIONS.map(
  (question) => question.id,
) as QuestionId[];

export const QUESTION_BY_ID: Record<QuestionId, QuizQuestion> =
  QUESTIONS.reduce(
    (acc, question) => {
      acc[question.id] = question;
      return acc;
    },
    {} as Record<QuestionId, QuizQuestion>,
  );

export const LAYER_1_DOMAIN_QUESTION_IDS: Record<
  DomainId,
  readonly [QuestionId, QuestionId]
> = {
  nourishment: ["Q1", "Q2"],
  craft: ["Q3", "Q4"],
  body: ["Q5", "Q6"],
  perception: ["Q7", "Q8"],
  relationships: ["Q9", "Q10"],
  money: ["Q11", "Q12"],
  environment: ["Q13", "Q14"],
};

export const LAYER_2_DOMAIN_QUESTION_IDS: Record<
  DomainId,
  readonly QuestionId[]
> = {
  nourishment: ["Q17", "Q21"],
  craft: ["Q15", "Q16", "Q19", "Q23"],
  body: ["Q15", "Q18", "Q22", "Q24"],
  perception: ["Q17", "Q18"],
  relationships: ["Q19", "Q20", "Q21"],
  money: ["Q16", "Q20", "Q22"],
  environment: ["Q23", "Q24"],
};
