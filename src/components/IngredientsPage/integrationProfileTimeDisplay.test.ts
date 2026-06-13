import { describe, expect, it } from "vitest";
import {
  buildLifecycleRibbonModel,
  getLifecycleRibbonRangePieces,
} from "./integrationProfileTimeDisplay";
import type { IntegrationProfileTime } from "../Forest/substrate/types";

const annualTime: IntegrationProfileTime = {
  lifeCycles: ["annual"],
  plantingWindow: [0, 1],
  firstYield: [0.3, 0.5],
  productiveWindow: [0.2, 1],
};

describe("integration profile time display", () => {
  it("derives an annual planting, first harvest, and productive span", () => {
    const model = buildLifecycleRibbonModel(annualTime);

    expect(model.lifecycleLabel).toBe("annual");
    expect(model.plantWindow.startYear).toBe(0);
    expect(model.plantWindow.endYear).toBe(1);
    expect(model.firstHarvestWindow.startYear).toBeCloseTo(0.3);
    expect(model.firstHarvestWindow.endYear).toBeCloseTo(1.5);
    expect(model.productiveSpan.startYear).toBeCloseTo(0.3);
    expect(model.productiveSpan.endYear).toBeCloseTo(2.5);
    expect(model.axis.compactTail).toBe(false);
    expect(model.summary.firstHarvest).toBe("Y0.3-Y1.5");
  });

  it("treats productive window as duration after first harvest for perennials", () => {
    const model = buildLifecycleRibbonModel({
      lifeCycles: ["perennial"],
      plantingWindow: [1, 4],
      firstYield: [3, 5],
      productiveWindow: [25, 50],
    });

    expect(model.firstHarvestWindow.startYear).toBe(4);
    expect(model.firstHarvestWindow.endYear).toBe(9);
    expect(model.productiveSpan.startYear).toBe(4);
    expect(model.productiveSpan.endYear).toBe(59);
    expect(model.summary.productiveDuration).toBe("25-50 yrs");
    expect(model.summary.productiveSpan).toBe("Y4-Y59");
  });

  it("uses a compact tail and splits ranges for long-lived timelines", () => {
    const model = buildLifecycleRibbonModel({
      lifeCycles: ["perennial"],
      plantingWindow: [0, 3],
      firstYield: [5, 10],
      productiveWindow: [100, 300],
    });
    const pieces = getLifecycleRibbonRangePieces(
      model.productiveSpan,
      model.axis,
    );

    expect(model.axis.compactTail).toBe(true);
    expect(model.axis.breakYear).toBeGreaterThan(
      model.firstHarvestWindow.endYear,
    );
    expect(pieces).toHaveLength(2);
    expect(pieces[0].endPercent).toBe(model.axis.breakStartPercent);
    expect(pieces[1].startPercent).toBe(model.axis.breakEndPercent);
  });

  it("falls back when no lifecycle label is recorded", () => {
    const model = buildLifecycleRibbonModel({
      ...annualTime,
      lifeCycles: [],
    });

    expect(model.lifecycleLabel).toBe("seasonal rhythm");
  });

  it("shows the active year marker only for active forest context", () => {
    expect(
      buildLifecycleRibbonModel(annualTime, { year: 2 }).now,
    ).toBeUndefined();

    const model = buildLifecycleRibbonModel(
      {
        lifeCycles: ["perennial"],
        plantingWindow: [0, 0],
        firstYield: [2, 4],
        productiveWindow: [10, 20],
      },
      { mode: "active", year: 1 },
    );

    expect(model.now?.year).toBe(1);
    expect(model.now?.stage).toBe("establishing");
    expect(model.now?.label).toBe("establishing");
  });

  it("classifies active years across harvest and productive phases", () => {
    expect(
      buildLifecycleRibbonModel(annualTime, { mode: "active", year: 0.8 }).now
        ?.stage,
    ).toBe("first_harvest");
    expect(
      buildLifecycleRibbonModel(annualTime, { mode: "active", year: 2 }).now
        ?.stage,
    ).toBe("productive");
    expect(
      buildLifecycleRibbonModel(annualTime, { mode: "active", year: 3 }).now
        ?.stage,
    ).toBe("after_productive");
  });
});
