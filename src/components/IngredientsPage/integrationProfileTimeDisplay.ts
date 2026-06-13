import { lifecycleLabelMap } from "../growthLabels";
import type { IntegrationProfileDisplayContext } from "../Forest/substrate/profiles/display";
import type { IntegrationProfileTime } from "../Forest/substrate/types";
import type { LifeCycleType } from "./types";

export type LifecycleRibbonStage =
  | "before_planting"
  | "planting_window"
  | "establishing"
  | "first_harvest"
  | "productive"
  | "after_productive";

export interface LifecycleRibbonAxis {
  endYear: number;
  compactTail: boolean;
  breakYear?: number;
  breakStartPercent?: number;
  breakEndPercent?: number;
}

export interface LifecycleRibbonRange {
  startYear: number;
  endYear: number;
  startPercent: number;
  endPercent: number;
}

export interface LifecycleRibbonRangePiece extends LifecycleRibbonRange {
  key: string;
}

export interface LifecycleRibbonNow {
  year: number;
  percent: number;
  stage: LifecycleRibbonStage;
  label: string;
}

export interface LifecycleRibbonModel {
  lifecycleLabel: string;
  plantWindow: LifecycleRibbonRange;
  firstHarvestWindow: LifecycleRibbonRange;
  productiveSpan: LifecycleRibbonRange;
  productiveCore: LifecycleRibbonRange;
  productiveUncertainty: LifecycleRibbonRange;
  axis: LifecycleRibbonAxis;
  now?: LifecycleRibbonNow;
  summary: {
    plantWindow: string;
    firstHarvest: string;
    productiveDuration: string;
    productiveSpan: string;
  };
}

const COMPACT_TAIL_THRESHOLD_YEARS = 20;
const COMPACT_BREAK_START_PERCENT = 72;
const COMPACT_BREAK_END_PERCENT = 78;

const STAGE_LABELS: Record<LifecycleRibbonStage, string> = {
  before_planting: "before planting",
  planting_window: "planting window",
  establishing: "establishing",
  first_harvest: "first harvest",
  productive: "productive",
  after_productive: "after productive span",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function normalizeYearRange(range: [number, number]): [number, number] {
  const a = Math.max(0, finiteOrZero(range[0]));
  const b = Math.max(0, finiteOrZero(range[1]));
  return [Math.min(a, b), Math.max(a, b)];
}

function niceAxisEnd(rawEndYear: number): number {
  const endYear = Math.max(1, finiteOrZero(rawEndYear));

  if (endYear <= 3) return Math.ceil(endYear * 2) / 2;
  if (endYear <= 12) return Math.ceil(endYear);
  if (endYear <= 60) return Math.ceil(endYear / 5) * 5;
  return Math.ceil(endYear / 25) * 25;
}

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? rounded.toFixed(0) : `${rounded}`;
}

export function formatLifecycleYear(value: number): string {
  return `Y${formatNumber(value)}`;
}

export function formatLifecycleYearRange(range: [number, number]): string {
  const [start, end] = normalizeYearRange(range);
  if (start === end) return formatLifecycleYear(start);
  return `${formatLifecycleYear(start)}-${formatLifecycleYear(end)}`;
}

export function formatLifecycleDurationRange(range: [number, number]): string {
  const [start, end] = normalizeYearRange(range);
  if (start === end) return `${formatNumber(start)} yrs`;
  return `${formatNumber(start)}-${formatNumber(end)} yrs`;
}

function formatLifecycleLabel(lifeCycles: LifeCycleType[]): string {
  if (lifeCycles.length === 0) return "seasonal rhythm";

  return lifeCycles
    .map((cycle) => lifecycleLabelMap[cycle] ?? cycle.replace(/_/g, " "))
    .join(", ");
}

function getActiveStage(
  year: number,
  plantWindow: [number, number],
  firstHarvestWindow: [number, number],
  productiveEndYear: number,
): LifecycleRibbonStage {
  if (year < plantWindow[0]) return "before_planting";
  if (year < firstHarvestWindow[0]) {
    return year <= plantWindow[1] ? "planting_window" : "establishing";
  }
  if (year <= firstHarvestWindow[1]) return "first_harvest";
  if (year <= productiveEndYear) return "productive";
  return "after_productive";
}

function buildLifecycleRibbonAxis(
  endYear: number,
  firstHarvestEndYear: number,
): LifecycleRibbonAxis {
  const axisEnd = niceAxisEnd(endYear);
  const compactTail = axisEnd > COMPACT_TAIL_THRESHOLD_YEARS;

  if (!compactTail) {
    return {
      endYear: axisEnd,
      compactTail: false,
    };
  }

  const latestEarlyMilestone = Math.ceil(firstHarvestEndYear + 2);
  const breakYear = clamp(latestEarlyMilestone, 2, Math.max(2, axisEnd - 1));

  return {
    endYear: axisEnd,
    compactTail: true,
    breakYear,
    breakStartPercent: COMPACT_BREAK_START_PERCENT,
    breakEndPercent: COMPACT_BREAK_END_PERCENT,
  };
}

export function mapLifecycleRibbonYearToPercent(
  year: number,
  axis: LifecycleRibbonAxis,
): number {
  const clampedYear = clamp(finiteOrZero(year), 0, axis.endYear);

  if (
    !axis.compactTail ||
    axis.breakYear === undefined ||
    axis.breakStartPercent === undefined ||
    axis.breakEndPercent === undefined ||
    axis.breakYear >= axis.endYear
  ) {
    return (clampedYear / axis.endYear) * 100;
  }

  if (clampedYear <= axis.breakYear) {
    return (clampedYear / axis.breakYear) * axis.breakStartPercent;
  }

  const tailProgress =
    (clampedYear - axis.breakYear) / (axis.endYear - axis.breakYear);
  return axis.breakEndPercent + tailProgress * (100 - axis.breakEndPercent);
}

function buildRange(
  range: [number, number],
  axis: LifecycleRibbonAxis,
): LifecycleRibbonRange {
  const [startYear, endYear] = normalizeYearRange(range);
  return {
    startYear,
    endYear,
    startPercent: mapLifecycleRibbonYearToPercent(startYear, axis),
    endPercent: mapLifecycleRibbonYearToPercent(endYear, axis),
  };
}

export function getLifecycleRibbonRangePieces(
  range: LifecycleRibbonRange,
  axis: LifecycleRibbonAxis,
): LifecycleRibbonRangePiece[] {
  if (
    !axis.compactTail ||
    axis.breakYear === undefined ||
    axis.breakStartPercent === undefined ||
    axis.breakEndPercent === undefined ||
    range.startYear >= axis.breakYear ||
    range.endYear <= axis.breakYear
  ) {
    return [{ ...range, key: "whole" }];
  }

  return [
    {
      key: "pre-break",
      startYear: range.startYear,
      endYear: axis.breakYear,
      startPercent: range.startPercent,
      endPercent: axis.breakStartPercent,
    },
    {
      key: "post-break",
      startYear: axis.breakYear,
      endYear: range.endYear,
      startPercent: axis.breakEndPercent,
      endPercent: range.endPercent,
    },
  ];
}

export function buildLifecycleRibbonModel(
  time: IntegrationProfileTime,
  context: IntegrationProfileDisplayContext = {},
): LifecycleRibbonModel {
  const plantWindow = normalizeYearRange(time.plantingWindow);
  const firstYield = normalizeYearRange(time.firstYield);
  const productiveWindow = normalizeYearRange(time.productiveWindow);
  const firstHarvestWindow: [number, number] = [
    plantWindow[0] + firstYield[0],
    plantWindow[1] + firstYield[1],
  ];
  const productiveEndWindow: [number, number] = [
    firstHarvestWindow[0] + productiveWindow[0],
    firstHarvestWindow[1] + productiveWindow[1],
  ];
  const axis = buildLifecycleRibbonAxis(
    productiveEndWindow[1],
    firstHarvestWindow[1],
  );
  const nowYear =
    context.mode === "active" && Number.isFinite(context.year)
      ? Math.max(0, context.year as number)
      : undefined;
  const nowStage =
    nowYear === undefined
      ? undefined
      : getActiveStage(
          nowYear,
          plantWindow,
          firstHarvestWindow,
          productiveEndWindow[1],
        );
  const now =
    nowYear === undefined || nowStage === undefined
      ? undefined
      : {
          year: nowYear,
          percent: mapLifecycleRibbonYearToPercent(nowYear, axis),
          stage: nowStage,
          label: STAGE_LABELS[nowStage],
        };

  return {
    lifecycleLabel: formatLifecycleLabel(time.lifeCycles),
    plantWindow: buildRange(plantWindow, axis),
    firstHarvestWindow: buildRange(firstHarvestWindow, axis),
    productiveSpan: buildRange(
      [firstHarvestWindow[0], productiveEndWindow[1]],
      axis,
    ),
    productiveCore: buildRange(
      [firstHarvestWindow[0], productiveEndWindow[0]],
      axis,
    ),
    productiveUncertainty: buildRange(productiveEndWindow, axis),
    axis,
    now,
    summary: {
      plantWindow: formatLifecycleYearRange(plantWindow),
      firstHarvest: formatLifecycleYearRange(firstHarvestWindow),
      productiveDuration: formatLifecycleDurationRange(productiveWindow),
      productiveSpan: formatLifecycleYearRange([
        firstHarvestWindow[0],
        productiveEndWindow[1],
      ]),
    },
  };
}
