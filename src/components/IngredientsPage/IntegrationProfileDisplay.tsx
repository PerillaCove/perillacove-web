import { useId, useState, type ReactNode, type RefObject } from "react";
import clsx from "clsx";
import type { Ingredient } from "./types";
import {
  INTEGRATION_PROFILE_TIME_PUZZLE_ENABLED,
  TIME_PUZZLE_CARD_GAP_PX,
  buildTimePuzzlePath,
  useTimePuzzleLayout,
  type TimePuzzleLayout,
} from "./integrationProfilePuzzleLayout";
import {
  buildLifecycleRibbonModel,
  formatLifecycleYear,
  getLifecycleRibbonRangePieces,
  type LifecycleRibbonModel,
  type LifecycleRibbonRangePiece,
} from "./integrationProfileTimeDisplay";
import {
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENT_LABELS,
} from "../Forest/substrate/labels";
import { buildIngredientIntegrationProfile } from "../Forest/substrate/profiles";
import {
  buildElementCapacityFactors,
  getCapacityDisplayValues,
  getTransformationDisplayRows,
  orderedOutputElements,
  summarizeElementCapacityFactors,
  type IntegrationProfileDisplayContext,
  type IntegrationTraitDisplay,
  type IntegrationTransformationDisplayRow,
} from "../Forest/substrate/profiles/display";
import type { ElementId } from "../Forest/substrate/types";
import { ELEMENT_IDS } from "../Forest/substrate/types";
import {
  integrationProfileCardClasses,
  integrationProfileInsetCardClasses,
} from "./integrationProfileStyles";

interface IntegrationProfileDisplayProps
  extends IntegrationProfileDisplayContext {
  ingredient: Ingredient;
  enableTimePuzzleLayout?: boolean;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ElementIcon({
  element,
  className,
}: {
  element: ElementId;
  className?: string;
}) {
  return (
    <i
      className={clsx("fa-regular", ELEMENT_ICONS[element], className)}
      style={{ color: ELEMENT_COLORS[element] }}
      title={ELEMENT_LABELS[element]}
    />
  );
}

function ElementIconCluster({
  elements,
  className,
}: {
  elements: ElementId[];
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-1", className)}>
      {elements.map((element) => (
        <ElementIcon key={element} element={element} className="text-base" />
      ))}
    </span>
  );
}

function CapacityGauge({
  color,
  values,
}: {
  color: string;
  values: ReturnType<typeof getCapacityDisplayValues>;
}) {
  const displayWidth = `${values.display * 100}%`;
  const potentialLeft = `${values.potential * 100}%`;
  const showPotentialMarker =
    values.mode === "active" && values.potential > values.display + 0.01;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        <span>
          {values.mode === "active"
            ? "Harnessing Capacity (now)"
            : "Harnessing Capacity"}
        </span>
        <span className="font-semibold" style={{ color }}>
          {formatPercent(values.display)}
        </span>
      </div>
      <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full"
          style={{
            width: displayWidth,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
          }}
        />
        {showPotentialMarker ? (
          <div
            className="absolute top-[-0.125rem] h-3.5 w-0.5 rounded-full bg-neutral-50 shadow"
            style={{ left: potentialLeft }}
            title={`Potential ${formatPercent(values.potential)}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function CapacityFactor({ factor }: { factor: IntegrationTraitDisplay }) {
  const relatedElements = [
    factor.primaryElement,
    ...factor.relatedElements.filter(
      (element) => element !== factor.primaryElement,
    ),
  ];

  return (
    <div className={integrationProfileInsetCardClasses}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-base font-medium text-neutral-800 dark:text-neutral-100">
          {factor.label}
        </div>
        <ElementIconCluster elements={relatedElements} className="shrink-0" />
      </div>
      <p className="mt-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
        {factor.summary}
      </p>
    </div>
  );
}

function TurnoverRow({ row }: { row: IntegrationTransformationDisplayRow }) {
  const outputs = orderedOutputElements(row.outputs);

  return (
    <div className={integrationProfileInsetCardClasses}>
      <div className="flex flex-wrap items-center gap-2 text-base text-neutral-800 dark:text-neutral-100">
        <ElementIconCluster elements={row.inputs} />
        <i className="fa-solid fa-arrow-right text-base text-neutral-400" />
        <span className="font-medium">{row.label}</span>
        <i className="fa-solid fa-arrow-right text-base text-neutral-400" />
        <ElementIconCluster elements={outputs} />
      </div>
      <p className="mt-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
        {row.definition}
      </p>
    </div>
  );
}

function AnimatedDisclosure({
  trigger,
  triggerClassName,
  children,
  className,
}: {
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex w-full cursor-pointer items-center justify-between text-left",
          triggerClassName,
        )}
      >
        {trigger}
        <i
          className={clsx(
            "fa-solid fa-chevron-down text-sm text-neutral-500 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function TimeHeader() {
  return (
    <div className="flex items-center gap-2">
      <i className="fa-regular fa-clock text-lg text-violet-600 dark:text-violet-300" />
      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
        Time
      </h4>
    </div>
  );
}

function getRibbonPieceRect(piece: LifecycleRibbonRangePiece, minWidth = 0.9) {
  const start = Math.max(0, Math.min(100, piece.startPercent));
  const end = Math.max(0, Math.min(100, piece.endPercent));
  const x = Math.min(start, end);
  const rawWidth = Math.abs(end - start);
  const width = Math.min(100 - x, Math.max(rawWidth, minWidth));

  return { x, width };
}

function RibbonRects({
  pieces,
  y,
  height,
  fill,
  opacity = 1,
  stroke,
  strokeWidth = 0,
  minWidth,
}: {
  pieces: LifecycleRibbonRangePiece[];
  y: number;
  height: number;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  minWidth?: number;
}) {
  return (
    <>
      {pieces.map((piece) => {
        const rect = getRibbonPieceRect(piece, minWidth);

        return (
          <rect
            key={piece.key}
            x={rect.x}
            y={y}
            width={rect.width}
            height={height}
            rx="1.6"
            fill={fill}
            opacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </>
  );
}

function continuousRibbonPiece(range: LifecycleRibbonModel["productiveCore"]) {
  return [{ ...range, key: "whole" }];
}

function TimeRibbonChart({ model }: { model: LifecycleRibbonModel }) {
  const id = useId().replace(/:/g, "");
  const hatchId = `time-ribbon-hatch-${id}`;
  const plantPieces = getLifecycleRibbonRangePieces(
    model.plantWindow,
    model.axis,
  );
  const firstHarvestPieces = getLifecycleRibbonRangePieces(
    model.firstHarvestWindow,
    model.axis,
  );
  const productiveCorePieces = continuousRibbonPiece(model.productiveCore);
  const productiveUncertaintyPieces = continuousRibbonPiece(
    model.productiveUncertainty,
  );
  const nowPercent =
    model.now?.percent === undefined
      ? undefined
      : Math.max(0, Math.min(100, model.now.percent));

  return (
    <div className="mt-3">
      <svg
        role="img"
        aria-label={`Lifecycle timeline. Planting window ${model.summary.plantWindow}. First harvest ${model.summary.firstHarvest}. Produces for ${model.summary.productiveDuration}.`}
        viewBox="0 0 100 34"
        preserveAspectRatio="none"
        className="h-11 w-full overflow-visible"
      >
        <defs>
          <pattern
            id={hatchId}
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(35)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="#a78bfa"
              strokeWidth="1.25"
              opacity="0.9"
            />
          </pattern>
        </defs>

        <line
          x1="0"
          x2="100"
          y1="17"
          y2="17"
          className="stroke-neutral-300 dark:stroke-neutral-700"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        <RibbonRects
          pieces={productiveUncertaintyPieces}
          y={14}
          height={6}
          fill="#34d399"
          opacity={0.24}
          minWidth={0.8}
        />
        <RibbonRects
          pieces={productiveCorePieces}
          y={14}
          height={6}
          fill="#10b981"
          opacity={0.72}
          minWidth={1}
        />
        <RibbonRects
          pieces={plantPieces}
          y={12}
          height={10}
          fill={`url(#${hatchId})`}
          opacity={0.95}
          stroke="#a78bfa"
          strokeWidth={1}
          minWidth={1.2}
        />
        <RibbonRects
          pieces={firstHarvestPieces}
          y={11}
          height={12}
          fill="#f59e0b"
          opacity={0.82}
          minWidth={1.2}
        />

        {model.axis.compactTail &&
        model.axis.breakStartPercent !== undefined &&
        model.axis.breakEndPercent !== undefined ? (
          <>
            <path
              d={`M ${model.axis.breakStartPercent + 1.4} 24 L ${
                model.axis.breakStartPercent + 3.8
              } 10 M ${model.axis.breakStartPercent + 3.7} 24 L ${
                model.axis.breakStartPercent + 6.1
              } 10`}
              className="stroke-neutral-400 dark:stroke-neutral-500"
              strokeWidth="1"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}

        {nowPercent !== undefined ? (
          <>
            <line
              x1={nowPercent}
              x2={nowPercent}
              y1="6"
              y2="28"
              stroke="#e5e7eb"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={nowPercent}
              cy="17"
              r="1.8"
              fill="#f8fafc"
              stroke="#111827"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>

      <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        <span>Y0</span>
        <span>{formatLifecycleYear(model.axis.endYear)}</span>
      </div>
    </div>
  );
}

function TimeMetric({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        <i className={clsx("fa-solid text-[0.7rem]", icon)} />
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-base font-medium leading-snug text-neutral-800 dark:text-neutral-100">
        {value}
      </div>
      {note ? (
        <div className="text-xs leading-snug text-neutral-500 dark:text-neutral-400">
          {note}
        </div>
      ) : null}
    </div>
  );
}

function TimeProfileContent({
  model,
  className,
  puzzle,
  leftColumnDrop,
  rightColumnDrop,
}: {
  model: LifecycleRibbonModel;
  className?: string;
  puzzle?: TimePuzzleLayout;
  leftColumnDrop?: number;
  rightColumnDrop?: number;
}) {
  const metrics = (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      <TimeMetric
        icon="fa-seedling"
        label="Planting window"
        value={model.summary.plantWindow}
      />
      <TimeMetric
        icon="fa-wheat-awn"
        label="First harvest"
        value={model.summary.firstHarvest}
      />
      <TimeMetric
        icon="fa-arrows-rotate"
        label="Produces for"
        value={model.summary.productiveDuration}
        note={`after first harvest`}
      />
    </div>
  );
  const header = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <TimeHeader />
    </div>
  );

  if (puzzle?.active) {
    return (
      <div
        className={clsx(
          "text-base text-neutral-700 dark:text-neutral-200",
          className,
        )}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4">
          {puzzle.shorter === "left" ? (
            <>
              {header}
              <div
                aria-hidden="true"
                className="hidden sm:block"
                style={{ minHeight: rightColumnDrop }}
              />
            </>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="hidden sm:block"
                style={{ minHeight: leftColumnDrop }}
              />
              {header}
            </>
          )}
        </div>
        <TimeRibbonChart model={model} />
        {metrics}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "text-base text-neutral-700 dark:text-neutral-200",
        className,
      )}
    >
      {header}
      <TimeRibbonChart model={model} />
      {metrics}
    </div>
  );
}

function TimeProfileCard({
  profile,
  puzzle,
  timeCardRef,
  context,
}: {
  profile: ReturnType<typeof buildIngredientIntegrationProfile>;
  puzzle: TimePuzzleLayout;
  timeCardRef: RefObject<HTMLElement>;
  context: IntegrationProfileDisplayContext;
}) {
  const puzzleSurfacePath = buildTimePuzzlePath(puzzle, 0);
  const puzzleBorderPath = buildTimePuzzlePath(puzzle, 0.75);
  const leftColumnDrop =
    puzzle.active && puzzle.shorter === "right" ? puzzle.delta : undefined;
  const rightColumnDrop =
    puzzle.active && puzzle.shorter === "left" ? puzzle.delta : undefined;
  const ribbonModel = buildLifecycleRibbonModel(profile.time, context);

  if (puzzle.active) {
    return (
      <section
        ref={timeCardRef}
        aria-label="Time"
        className="relative mt-3 overflow-hidden"
        style={{
          marginTop: `${TIME_PUZZLE_CARD_GAP_PX - puzzle.delta}px`,
        }}
      >
        {puzzleSurfacePath && puzzleBorderPath ? (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${Math.max(puzzle.width, 1)} ${Math.max(
              puzzle.height,
              1,
            )}`}
            preserveAspectRatio="none"
          >
            <path
              d={puzzleSurfacePath}
              className="fill-white/75 dark:fill-neutral-900/55"
            />
            <path
              d={puzzleBorderPath}
              fill="none"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="stroke-neutral-200 dark:stroke-neutral-700"
            />
          </svg>
        ) : null}

        <TimeProfileContent
          model={ribbonModel}
          puzzle={puzzle}
          className="relative z-10 p-3"
          leftColumnDrop={leftColumnDrop}
          rightColumnDrop={rightColumnDrop}
        />
      </section>
    );
  }

  return (
    <section
      ref={timeCardRef}
      className={clsx(integrationProfileCardClasses, "mt-3")}
    >
      <TimeProfileContent model={ribbonModel} />
    </section>
  );
}

function AnimalLifespanCard({
  profile,
}: {
  profile: ReturnType<typeof buildIngredientIntegrationProfile>;
}) {
  const lifecycle = profile.animalLifecycle;
  if (!lifecycle) return null;

  const maturityYears = Math.max(0, lifecycle.maturityYears);
  const lifespanYears = Math.max(maturityYears, lifecycle.lifespanYears);
  const adultYears = Math.max(0, lifespanYears - maturityYears);

  return (
    <section className={clsx(integrationProfileCardClasses, "mt-3")}>
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-heart-pulse text-lg text-emerald-600 dark:text-emerald-300" />
        <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Lifespan
        </h4>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TimeMetric
          icon="fa-circle-dot"
          label="Introduced"
          value={`Y${formatLifecycleYear(lifecycle.startYear).replace(/^Y/, "")}`}
        />
        <TimeMetric
          icon="fa-up-right-and-down-left-from-center"
          label="Adult size"
          value={`${maturityYears.toFixed(1)} yrs`}
        />
        <TimeMetric
          icon="fa-arrows-rotate"
          label="Respawn cycle"
          value={`${lifespanYears.toFixed(1)} yrs`}
          note={`${adultYears.toFixed(1)} adult years`}
        />
      </div>
    </section>
  );
}

function ElementCapacityCard({
  element,
  potential,
  factors,
  turnover,
  context,
}: {
  element: ElementId;
  potential: number;
  factors: IntegrationTraitDisplay[];
  turnover: IntegrationTransformationDisplayRow[];
  context: IntegrationProfileDisplayContext;
}) {
  const color = ELEMENT_COLORS[element];
  const values = getCapacityDisplayValues(potential, context);

  return (
    <section className={integrationProfileCardClasses}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ElementIcon element={element} className="text-xl" />
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {ELEMENT_LABELS[element]}
          </h4>
        </div>
        <div
          className="rounded-md border px-2 py-0.5 text-sm font-semibold"
          style={{
            borderColor: color,
            color,
          }}
        >
          {formatPercent(values.display)}
        </div>
      </div>

      <CapacityGauge color={color} values={values} />

      {/* <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
        {summarizeElementCapacityFactors(element, factors)}
      </p> */}

      {factors.length > 0 ? (
        <AnimatedDisclosure
          className="mt-3"
          triggerClassName="rounded-md border border-neutral-200 bg-neutral-100/80 px-2 py-1.5 text-base text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
          trigger={
            <span>{summarizeElementCapacityFactors(element, factors)}</span>
          }
        >
          <div className="mt-2 grid gap-2">
            {factors.map((factor) => (
              <CapacityFactor key={factor.token} factor={factor} />
            ))}
          </div>
        </AnimatedDisclosure>
      ) : null}

      {turnover.length > 0 ? (
        <AnimatedDisclosure
          className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
          triggerClassName="rounded-md px-0 py-1 text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400"
          trigger={<span>Turnover</span>}
        >
          <p className="mt-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            Turnover appears when required flows are actively being used, then
            returns new supply to the field.
          </p>
          <div className="mt-2 grid gap-2">
            {turnover.map((row, index) => (
              <TurnoverRow key={`${row.id}:${row.rate}:${index}`} row={row} />
            ))}
          </div>
        </AnimatedDisclosure>
      ) : null}
    </section>
  );
}

export default function IntegrationProfileDisplay({
  ingredient,
  mode = "potential",
  year,
  intensity,
  enableTimePuzzleLayout = INTEGRATION_PROFILE_TIME_PUZZLE_ENABLED,
}: IntegrationProfileDisplayProps) {
  const profile = buildIngredientIntegrationProfile(ingredient);
  const context: IntegrationProfileDisplayContext = {
    mode,
    year,
    intensity,
  };
  const { frameRef, leftColumnRef, rightColumnRef, timeCardRef, timePuzzle } =
    useTimePuzzleLayout(enableTimePuzzleLayout);
  const columnRefs = [leftColumnRef, rightColumnRef] as const;

  return (
    <div ref={frameRef}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        {(
          [
            [ELEMENT_IDS[0], ELEMENT_IDS[2]],
            [ELEMENT_IDS[1], ELEMENT_IDS[3]],
          ] as [ElementId, ElementId][]
        ).map((col, ci) => (
          <div
            key={ci}
            ref={columnRefs[ci]}
            className="flex flex-1 flex-col gap-2"
          >
            {col.map((element) => (
              <ElementCapacityCard
                key={element}
                element={element}
                potential={profile.capacity[element].value}
                factors={buildElementCapacityFactors(profile, element)}
                turnover={getTransformationDisplayRows(
                  profile.transformations,
                  element,
                )}
                context={context}
              />
            ))}
          </div>
        ))}
      </div>

      {profile.profileKind === "animal" ? (
        <AnimalLifespanCard profile={profile} />
      ) : (
        <TimeProfileCard
          profile={profile}
          puzzle={timePuzzle}
          timeCardRef={timeCardRef}
          context={context}
        />
      )}
    </div>
  );
}
