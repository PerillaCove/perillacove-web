import { QUESTION_BY_ID, QUESTION_IDS } from "./questions";
import { TOTAL_QUESTIONS, type QuestionId, type QuizAnswers } from "./types";
import { isValidResponseValue } from "./responseMapping";

export const QUIZ_STORAGE_KEY = "integration_quiz_session_v2";
export const QUIZ_STORAGE_VERSION = 2;

export interface QuizSession {
  version: number;
  started: boolean;
  currentQuestionIndex: number;
  isComplete: boolean;
  answers: QuizAnswers;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clampQuestionIndex(index: number): number {
  if (!Number.isInteger(index)) {
    return 0;
  }

  return Math.max(0, Math.min(index, TOTAL_QUESTIONS - 1));
}

function sanitizeAnswers(rawAnswers: unknown): QuizAnswers {
  if (!rawAnswers || typeof rawAnswers !== "object") {
    return {};
  }

  const answers: QuizAnswers = {};

  for (const [rawKey, rawValue] of Object.entries(rawAnswers)) {
    if (!(rawKey in QUESTION_BY_ID)) {
      continue;
    }

    if (!isValidResponseValue(rawValue)) {
      continue;
    }

    answers[rawKey as QuestionId] = rawValue;
  }

  return answers;
}

export function normalizeQuizSession(raw: unknown): QuizSession {
  if (!raw || typeof raw !== "object") {
    return createEmptyQuizSession();
  }

  const parsed = raw as Partial<QuizSession>;
  if (parsed.version !== QUIZ_STORAGE_VERSION) {
    return createEmptyQuizSession();
  }

  const answers = sanitizeAnswers(parsed.answers);
  const answeredCount = Object.keys(answers).length;
  const isComplete =
    Boolean(parsed.isComplete) && answeredCount === QUESTION_IDS.length;

  return {
    version: QUIZ_STORAGE_VERSION,
    started: Boolean(parsed.started) || answeredCount > 0,
    currentQuestionIndex: isComplete
      ? TOTAL_QUESTIONS - 1
      : clampQuestionIndex(parsed.currentQuestionIndex ?? 0),
    isComplete,
    answers,
  };
}

export function createEmptyQuizSession(): QuizSession {
  return {
    version: QUIZ_STORAGE_VERSION,
    started: false,
    currentQuestionIndex: 0,
    isComplete: false,
    answers: {},
  };
}

export function loadQuizSession(): QuizSession {
  const storage = getStorage();
  if (!storage) {
    return createEmptyQuizSession();
  }

  const serialized = storage.getItem(QUIZ_STORAGE_KEY);
  if (!serialized) {
    return createEmptyQuizSession();
  }

  try {
    return normalizeQuizSession(JSON.parse(serialized));
  } catch {
    return createEmptyQuizSession();
  }
}

export function saveQuizSession(session: QuizSession): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(session));
}

export function clearQuizSession(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(QUIZ_STORAGE_KEY);
}
