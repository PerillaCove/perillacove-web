import clsx from "clsx";
import type { ReactNode } from "react";
import {
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENT_LABELS,
} from "../substrate/labels";
import { ELEMENT_INFO } from "../substrate/explain";
import type { ElementId, IntegrationElementBundle } from "../substrate/types";

interface ElementIntegrationDetailsModalProps {
  element: ElementId;
  currentReading: string;
  bundle: IntegrationElementBundle;
  onClose: () => void;
}

function DetailBlock({
  eyebrow,
  title,
  children,
  accentColor,
  emphasis = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  accentColor: string;
  emphasis?: boolean;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border p-4",
        emphasis ? "bg-white/[0.08]" : "border-white/10 bg-white/[0.035]",
      )}
      style={{
        borderColor: emphasis ? `${accentColor}88` : undefined,
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {eyebrow}
      </div>
      <h3 className="mt-1 text-lg font-semibold text-neutral-100">{title}</h3>
      <div className="mt-2 text-base leading-7 text-neutral-200/90">
        {children}
      </div>
    </section>
  );
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
      {elements.map((item) => (
        <ElementIcon key={item} element={item} className="text-base" />
      ))}
    </span>
  );
}

function ChannelRows({
  bundle,
  accentColor,
}: {
  bundle: IntegrationElementBundle;
  accentColor: string;
}) {
  return (
    <div className="mt-5 grid gap-4 border-t border-white/10 pt-4">
      {bundle.channels.map((channel) => {
        const score = Math.round(channel.integration * 100);
        const isLimiter =
          bundle.limitingChannel?.id === channel.id &&
          bundle.channels.length > 1;
        const relatedElements = [
          channel.primaryElement,
          ...channel.relatedElements.filter(
            (item) => item !== channel.primaryElement,
          ),
        ];
        return (
          <div key={channel.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="truncate text-sm font-semibold text-neutral-100">
                    {channel.label}
                  </div>
                  <ElementIconCluster
                    elements={relatedElements}
                    className="shrink-0"
                  />
                </div>
                {isLimiter ? (
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Limiting channel
                  </div>
                ) : null}
                <div className="mt-0.5 text-sm leading-5 text-neutral-400">
                  {channel.summary}
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums text-neutral-100">
                {score}
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${score}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ElementIntegrationDetailsModal({
  element,
  currentReading,
  bundle,
  onClose,
}: ElementIntegrationDetailsModalProps) {
  const info = ELEMENT_INFO[element];
  const color = ELEMENT_COLORS[element];
  const label = ELEMENT_LABELS[element];

  return (
    <div className="relative max-h-[86vh] overflow-y-auto rounded-lg bg-neutral-950 px-5 py-5 text-neutral-100 sm:px-7 sm:py-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-100"
        aria-label="Close element details"
      >
        <i className="fa-solid fa-xmark text-xl" />
      </button>

      <header className="flex items-start gap-4 pr-12">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-white/[0.06]"
          style={{ borderColor: `${color}99`, color }}
        >
          <i className={`fa-regular ${ELEMENT_ICONS[element]} text-3xl`} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Element Integration
          </div>
          <h2 className="mt-1 text-3xl font-bold text-neutral-50">{label}</h2>
        </div>
      </header>

      <div
        className="mt-5 h-1.5 rounded-full"
        style={{
          backgroundImage: `linear-gradient(90deg, ${color}22, ${color}cc)`,
        }}
        aria-hidden="true"
      />

      <div className="mt-5 grid gap-3">
        <DetailBlock
          eyebrow="What it is"
          title={`${label} in the system`}
          accentColor={color}
        >
          {info.body}
        </DetailBlock>
        <DetailBlock
          eyebrow="Integrated"
          title="When the loop is working"
          accentColor={color}
        >
          {info.supply}
        </DetailBlock>
        <DetailBlock
          eyebrow="Waste"
          title="When the loop is not yet turning cleanly"
          accentColor={color}
        >
          {info.capacity}
        </DetailBlock>
        <DetailBlock
          eyebrow="Current reading"
          title={`Right now, ${label.toLowerCase()} is saying`}
          accentColor={color}
          emphasis
        >
          <p>{currentReading}</p>
          <ChannelRows bundle={bundle} accentColor={color} />
        </DetailBlock>
      </div>
    </div>
  );
}
