import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
  preferredPosition?: "right" | "bottom" | "top" | "left";
}

export const defaultTourSteps: TourStep[] = [
  {
    targetSelector: '[data-tour="search"]',
    titleKey: "tour.steps.search.title",
    descKey: "tour.steps.search.desc",
    preferredPosition: "right",
  },
  {
    targetSelector: '[data-tour="add-product"]',
    titleKey: "tour.steps.addProduct.title",
    descKey: "tour.steps.addProduct.desc",
    preferredPosition: "right",
  },
  {
    targetSelector: '[data-tour="nav-finance"]',
    titleKey: "tour.steps.finance.title",
    descKey: "tour.steps.finance.desc",
    preferredPosition: "right",
  },
  {
    targetSelector: '[data-tour="nav-debts"]',
    titleKey: "tour.steps.debts.title",
    descKey: "tour.steps.debts.desc",
    preferredPosition: "right",
  },
  {
    targetSelector: '[data-tour="user-profile"]',
    titleKey: "tour.steps.profile.title",
    descKey: "tour.steps.profile.desc",
    preferredPosition: "right",
  },
];

export function SpotlightTour({
  open,
  onClose,
  steps = defaultTourSteps,
}: {
  open: boolean;
  onClose: () => void;
  steps?: TourStep[];
}) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const activeStep = steps[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (!activeStep) return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(activeStep.targetSelector),
    );
    const visibleEl = elements.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < window.innerHeight;
    }) ?? elements[0];

    if (visibleEl) {
      visibleEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const r = visibleEl.getBoundingClientRect();
      setRect(r);
    } else {
      setRect(null);
    }
  }, [activeStep]);

  useEffect(() => {
    if (!open) {
      setCurrentStepIndex(0);
      setRect(null);
      return;
    }

    // Settlement delay for dialog unmount animation
    const timer = setTimeout(() => {
      updateTargetRect();
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

  // Calculate tooltip placement dynamically relative to the highlighted target element
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 100,
  };

  if (rect && rect.width > 0) {
    const pad = 12;
    const cardWidth = 360;

    // Check if target is on the left sidebar
    if (rect.left < 320) {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, Math.min(rect.top, window.innerHeight - 260)),
        left: Math.min(rect.right + 20, window.innerWidth - cardWidth - 20),
        zIndex: 100,
      };
    } else if (rect.top < 150) {
      // Near top header
      tooltipStyle = {
        position: "fixed",
        top: rect.bottom + pad,
        left: Math.max(20, Math.min(rect.left, window.innerWidth - cardWidth - 20)),
        zIndex: 100,
      };
    } else {
      // Default floating placement
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, rect.top - 200),
        left: Math.max(20, Math.min(rect.left, window.innerWidth - cardWidth - 20)),
        zIndex: 100,
      };
    }
  } else {
    // Fallback centered card if target element is not found
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 100,
    };
  }

  return (
    <div className="fixed inset-0 z-[99] overflow-hidden">
      {/* SVG Mask for Spotlight Hole Cutout */}
      <svg className="absolute inset-0 size-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            {/* White rectangle covers the entire screen (opaque dark) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle cuts out the spotlight hole over target element */}
            {rect && (
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dark Overlay Layer applying the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Glowing Ring Overlay around target element */}
      {rect && (
        <div
          className="fixed rounded-xl ring-4 ring-sky-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all duration-300 pointer-events-none z-[99]"
          style={{
            top: `${rect.top - 8}px`,
            left: `${rect.left - 8}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
          }}
        />
      )}

      {/* Floating Step Tooltip Card */}
      <div
        className="w-full max-w-[360px] p-2 transition-all duration-300 pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="rounded-2xl border border-sky-500/30 bg-[#0b132b] p-5 text-white shadow-2xl space-y-4 ring-1 ring-sky-400/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                {t("tour.interactiveGuide")}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              title={t("common.close")}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white tracking-tight">
              {t(activeStep.titleKey)}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(activeStep.descKey)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="h-8 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              {t("help.prevStep")}
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30"
            >
              {currentStepIndex < steps.length - 1 ? (
                <>
                  {t("help.nextStep")}
                  <ArrowRight className="size-3.5 ml-1" />
                </>
              ) : (
                <>
                  <Check className="size-3.5 mr-1" />
                  {t("help.finishWizard")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
