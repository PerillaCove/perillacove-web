import { describe, expect, it } from "vitest";
import {
  computeIntegration,
  computeLayer1Scores,
  computeLayer2Scores,
  computeQuizResult,
  normalizeRawAverage,
} from "./scoring";
import type { CompleteQuizAnswers, QuizAnswers } from "./types";

const COMPLETE_FIXTURE_ANSWERS: CompleteQuizAnswers = {
  Q1: 6.2,
  Q2: 5.5,
  Q3: 6,
  Q4: 2,
  Q5: 4.7,
  Q6: 2.5,
  Q7: 6,
  Q8: 5,
  Q9: 3.4,
  Q10: 4,
  Q11: 7,
  Q12: 2.8,
  Q13: 5,
  Q14: 3,
  Q15: 6.6,
  Q16: 2,
  Q17: 5.5,
  Q18: 3,
  Q19: 4.9,
  Q20: 1,
  Q21: 4,
  Q22: 2,
  Q23: 6,
  Q24: 5.3,
};

describe("integration quiz scoring", () => {
  describe("normalizeRawAverage", () => {
    it("maps 1 to 0 and 7 to 10", () => {
      expect(normalizeRawAverage(1)).toBe(0);
      expect(normalizeRawAverage(7)).toBe(10);
    });
  });

  describe("Layer 1 scoring", () => {
    it("computes expected domain averages and normalized scores", () => {
      const result = computeLayer1Scores(COMPLETE_FIXTURE_ANSWERS);

      expect(result.raw.nourishment).toBeCloseTo(5.85, 6);
      expect(result.raw.craft).toBe(4);
      expect(result.raw.body).toBeCloseTo(3.6, 6);

      expect(result.normalized.nourishment).toBeCloseTo(8.0833, 3);
      expect(result.normalized.craft).toBeCloseTo(5, 5);
      expect(result.normalized.body).toBeCloseTo(4.3333, 3);
    });
  });

  describe("Layer 2 scoring", () => {
    it("computes expected domain averages and normalized scores", () => {
      const result = computeLayer2Scores(COMPLETE_FIXTURE_ANSWERS);

      expect(result.raw.nourishment).toBeCloseTo(4.75, 6);
      expect(result.raw.money).toBeCloseTo(1.6667, 3);
      expect(result.raw.environment).toBeCloseTo(5.65, 6);

      expect(result.normalized.nourishment).toBeCloseTo(6.25, 3);
      expect(result.normalized.money).toBeCloseTo(1.1111, 3);
      expect(result.normalized.environment).toBeCloseTo(7.75, 3);
    });
  });

  describe("computeQuizResult", () => {
    it("returns a complete result for mixed discrete and continuous answers", () => {
      const result = computeQuizResult(COMPLETE_FIXTURE_ANSWERS);

      expect(result.layer1.normalized.nourishment).toBeCloseTo(8.0833, 3);
      expect(result.layer2.normalized.money).toBeCloseTo(1.1111, 3);
      expect(result.layer2QuestionScores.Q24).toBeCloseTo(5.3, 6);
      expect(result.integration.overall).toBeGreaterThanOrEqual(0);
      expect(result.integration.overall).toBeLessThanOrEqual(10);
    });

    it("throws on incomplete answers", () => {
      const incomplete: QuizAnswers = { ...COMPLETE_FIXTURE_ANSWERS };
      delete incomplete.Q24;

      expect(() => computeQuizResult(incomplete)).toThrow(
        "Cannot score incomplete quiz answers",
      );
    });
  });

  describe("integration", () => {
    it("returns high integration for even scores", () => {
      const result = computeIntegration([5, 5, 5, 5, 5, 5, 5]);
      expect(result.cv).toBe(0);
      expect(result.integration).toBe(10);
    });

    it("returns lower integration for jagged scores", () => {
      const even = computeIntegration([6, 6, 6, 6, 6, 6, 6]);
      const jagged = computeIntegration([1, 10, 2, 9, 3, 8, 4]);

      expect(jagged.integration).toBeLessThan(even.integration);
    });

    it("handles mean-zero edge case as perfect integration", () => {
      const zero = computeIntegration([0, 0, 0, 0, 0, 0, 0]);
      expect(zero.cv).toBe(0);
      expect(zero.integration).toBe(10);
    });

    it("clamps very high CV to non-negative integration", () => {
      const result = computeIntegration([0, 0, 0, 0, 0, 0, 10]);
      expect(result.integration).toBeGreaterThanOrEqual(0);
    });

    it("matches overall integration as average of two layers", () => {
      const quizResult = computeQuizResult(COMPLETE_FIXTURE_ANSWERS);
      const expectedOverall =
        (quizResult.integration.internal.integration +
          quizResult.integration.crossDomain.integration) /
        2;

      expect(quizResult.integration.overall).toBeCloseTo(expectedOverall, 8);
    });
  });
});
