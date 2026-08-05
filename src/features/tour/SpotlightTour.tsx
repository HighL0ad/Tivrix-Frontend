import { type CSSProperties, useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  SearchX,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
}

interface TargetRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export const topicTours: Record<string, TourStep[]> = {
  "quick-start": [
    {
      targetSelector: '[data-tour="nav-finance"]',
      titleKey: "tour.steps.quickStart.step1Title",
      descKey: "tour.steps.quickStart.step1Desc",
    },
    {
      targetSelector: '[data-tour="add-product"]',
      titleKey: "tour.steps.quickStart.step2Title",
      descKey: "tour.steps.quickStart.step2Desc",
    },
    {
      targetSelector: '[data-tour="nav-clients"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.quickStart.step3Title",
      descKey: "tour.steps.quickStart.step3Desc",
    },
    {
      targetSelector: '[data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.quickStart.step4Title",
      descKey: "tour.steps.quickStart.step4Desc",
    },
  ],
  "imei-management": [
    {
      targetSelector: '[data-tour="add-product"]',
      titleKey: "tour.steps.imei.step1Title",
      descKey: "tour.steps.imei.step1Desc",
    },
    {
      targetSelector: '[data-tour="nav-products"]',
      titleKey: "tour.steps.imei.step2Title",
      descKey: "tour.steps.imei.step2Desc",
    },
    {
      targetSelector: '[data-tour="search"]',
      titleKey: "tour.steps.imei.step3Title",
      descKey: "tour.steps.imei.step3Desc",
    },
  ],
  "installment-system": [
    {
      targetSelector: '[data-tour="add-product"]',
      titleKey: "tour.steps.installments.step1Title",
      descKey: "tour.steps.installments.step1Desc",
    },
    {
      targetSelector: '[data-tour="nav-debts"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.installments.step2Title",
      descKey: "tour.steps.installments.step2Desc",
    },
    {
      targetSelector: '[data-tour="nav-clients"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.installments.step3Title",
      descKey: "tour.steps.installments.step3Desc",
    },
  ],
  "cash-and-finance": [
    {
      targetSelector: '[data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step1Title",
      descKey: "tour.steps.finance.step1Desc",
    },
    {
      targetSelector: '[data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step2Title",
      descKey: "tour.steps.finance.step2Desc",
    },
    {
      targetSelector: '[data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step3Title",
      descKey: "tour.steps.finance.step3Desc",
    },
  ],
  "staff-and-roles": [
    {
      targetSelector: '[data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.users.step1Title",
      descKey: "tour.steps.users.step1Desc",
    },
    {
      targetSelector: '[data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.users.step2Title",
      descKey: "tour.steps.users.step2Desc",
    },
    {
      targetSelector: '[data-tour="user-profile"]',
      titleKey: "tour.steps.users.step3Title",
      descKey: "tour.steps.users.step3Desc",
    },
  ],
};

export function SpotlightTour({
  open,
  topicId = "quick-start",
  onClose,
}: {
  open: boolean;
  topicId?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const maskId = `spotlight-mask-${useId().replace(/:/g, "")}`;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const steps = useMemo(() => topicTours[topicId] ?? topicTours["quick-start"], [topicId]);
  const activeStep = steps[currentStepIndex];

  const updateTargetRect = useCallback((scrollToTarget = false) => {
    if (!activeStep) return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(activeStep.targetSelector),
    );
    const visibleEl = elements.find((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.right > 0 &&
        r.left < window.innerWidth &&
        r.bottom > 0 &&
        r.top < window.innerHeight
      );
    }) ?? elements[0];

    if (visibleEl) {
      setTargetMissing(false);

      if (scrollToTarget) {
        visibleEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }

      window.requestAnimationFrame(() => {
        const r = visibleEl.getBoundingClientRect();
        setRect({
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        });
      });
    } else {
      setRect(null);
      setTargetMissing(true);
    }
  }, [activeStep]);

  useEffect(() => {
    if (!open) {
      setCurrentStepIndex(0);
      setRect(null);
      return;
    }

    const timer = setTimeout(() => {
      updateTargetRect(true);
    }, 150);

    const handleResizeOrScroll = () => {
      updateTargetRect();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [open, currentStepIndex, updateTargetRect]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }

      if (event.key === "ArrowLeft" && currentStepIndex > 0) {
        event.preventDefault();
        setCurrentStepIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, onClose, open, steps.length]);

  if (!open || !activeStep) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const tooltipStyle: CSSProperties = {
    position: "fixed",
    zIndex: 101,
    ...getTooltipPosition(rect),
  };

  const maskUrl = `url(#${maskId})`;

  return (
    <div
      className="fixed inset-0 z-[99] overflow-hidden pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("tour.interactiveGuide")}
    >
      <svg className="absolute inset-0 size-full pointer-events-auto" onClick={onClose}>
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={Math.max(8, rect.left - 8)}
                y={Math.max(8, rect.top - 8)}
                width={Math.max(0, Math.min(rect.width + 16, window.innerWidth - Math.max(8, rect.left - 8) - 8))}
                height={Math.max(0, Math.min(rect.height + 16, window.innerHeight - Math.max(8, rect.top - 8) - 8))}
                rx="10"
                ry="10"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.72)"
          mask={maskUrl}
        />
      </svg>

      {rect && (
        <div
          className="fixed rounded-xl ring-2 ring-sky-300 ring-offset-4 ring-offset-slate-950/90 shadow-[0_0_0_1px_rgba(14,165,233,0.25),0_12px_36px_rgba(14,165,233,0.35)] transition-all duration-200 pointer-events-none z-[100]"
          style={{
            top: `${rect.top - 8}px`,
            left: `${rect.left - 8}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
          }}
        />
      )}

      <div
        className="w-[calc(100vw-32px)] max-w-[360px] transition-all duration-200 pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950 p-4 text-white shadow-2xl ring-1 ring-sky-400/20 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 min-w-14 items-center justify-center rounded-md bg-sky-500/15 px-2 text-xs font-bold text-sky-300">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-sky-200">
                {t("tour.interactiveGuide")}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {targetMissing && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                <SearchX className="size-3.5" />
                {t("tour.targetUnavailable")}
              </div>
            )}
            <h3 className="text-base font-bold tracking-tight text-white">
              {t(activeStep.titleKey)}
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {t(activeStep.descKey)}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="h-9 px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 sm:px-3"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              {t("common.back")}
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="h-9 bg-sky-600 text-xs font-bold text-white shadow-md shadow-sky-950/30 hover:bg-sky-500"
            >
              {currentStepIndex < steps.length - 1 ? (
                <>
                  {t("common.next")}
                  <ArrowRight className="size-3.5 ml-1" />
                </>
              ) : (
                <>
                  <Check className="size-3.5 mr-1" />
                  {t("common.done")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTooltipPosition(rect: TargetRect | null): Pick<CSSProperties, "top" | "left" | "transform"> {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 16;
  const gap = 16;
  const cardWidth = Math.min(360, viewportWidth - margin * 2);
  const estimatedCardHeight = 240;

  if (!rect || rect.width <= 0 || viewportWidth < 640) {
    return {
      left: margin,
      top: Math.max(margin, viewportHeight - estimatedCardHeight - margin),
      transform: undefined,
    };
  }

  const hasRightSpace = rect.right + gap + cardWidth <= viewportWidth - margin;
  const hasLeftSpace = rect.left - gap - cardWidth >= margin;
  const topNearTarget = clamp(rect.top, margin, viewportHeight - estimatedCardHeight - margin);

  if (hasRightSpace) {
    return {
      left: rect.right + gap,
      top: topNearTarget,
      transform: undefined,
    };
  }

  if (hasLeftSpace) {
    return {
      left: rect.left - gap - cardWidth,
      top: topNearTarget,
      transform: undefined,
    };
  }

  const left = clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, viewportWidth - cardWidth - margin);
  const belowTop = rect.bottom + gap;
  const top = belowTop + estimatedCardHeight <= viewportHeight - margin
    ? belowTop
    : clamp(rect.top - estimatedCardHeight - gap, margin, viewportHeight - estimatedCardHeight - margin);

  return {
    left,
    top,
    transform: undefined,
  };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
