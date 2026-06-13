/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { formatIngredientIdForDisplay } from "./functions"; // Adjust the import path as necessary

describe("formatIngredientIdForDisplay", () => {
  it("should replace underscores with spaces when there are no descriptors", () => {
    const input = "apple_pie";
    const expectedOutput = "apple pie";
    expect(formatIngredientIdForDisplay(input)).toBe(expectedOutput);
  });

  it("should format the name and descriptors correctly", () => {
    const input = "apple_pie__sweet_tart";
    const expectedOutput = "apple pie (sweet, tart)";
    expect(formatIngredientIdForDisplay(input)).toBe(expectedOutput);
  });

  it("should handle names with no underscores", () => {
    const input = "apple";
    const expectedOutput = "apple";
    expect(formatIngredientIdForDisplay(input)).toBe(expectedOutput);
  });

  it("should handle names with no underscores but with spaces", () => {
    const input = "apple pie";
    const expectedOutput = "apple pie";
    expect(formatIngredientIdForDisplay(input)).toBe(expectedOutput);
  });

  it("should handle names with multiple underscores in descriptors", () => {
    const input = "apple_pie__sweet_tart_delicious";
    const expectedOutput = "apple pie (sweet, tart, delicious)";
    expect(formatIngredientIdForDisplay(input)).toBe(expectedOutput);
  });

  it("can hide descriptors when only the base display name is needed", () => {
    expect(
      formatIngredientIdForDisplay("whole_milk__cow", {
        includeDescriptors: false,
      }),
    ).toBe("whole milk");
  });
});
