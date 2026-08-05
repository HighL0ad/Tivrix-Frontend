import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
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
      targetSelector: '[data-tour="nav-clients"]',
      titleKey: "tour.steps.quickStart.step3Title",
      descKey: "tour.steps.quickStart.step3Desc",
    },
    {
      targetSelector: '[data-tour="nav-users"]',
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
      targetSelector: '[data-tour="nav-debts"]',
      titleKey: "tour.steps.installments.step2Title",
      descKey: "tour.steps.installments.step2Desc",
    },
    {
      targetSelector: '[data-tour="nav-clients"]',
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
      targetSelector: '[data-tour="nav-users"]',
      titleKey: "tour.steps.users.step1Title",
      descKey: "tour.steps.users.step1Desc",
    },
    {
      targetSelector: '[data-tour="nav-users"]',
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = topicTours[topicId] ?? topicTours["quick-start"];
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

  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 100,
  };

  if (rect && rect.width > 0) {
    const pad = 12;
    const cardWidth = 360;

    if (rect.left < 320) {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, Math.min(rect.top, window.innerHeight - 260)),
        left: Math.min(rect.right + 20, window.innerWidth - cardWidth - 20),
        zIndex: 100,
      };
    } else if (rect.top < 150) {
      tooltipStyle = {
        position: "fixed",
        top: rect.bottom + pad,
        left: Math.max(20, Math.min(rect.left, window.innerWidth - cardWidth - 20)),
        zIndex: 100,
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(20, rect.top - 200),
        left: Math.max(20, Math.min(rect.left, window.innerWidth - cardWidth - 20)),
        zIndex: 100,
      };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 100,
    };
  }

  return (
    <div className="fixed inset-0 z-[99] overflow-hidden pointer-events-none">
      {/* SVG Mask for Spotlight Hole Cutout */}
      <svg className="absolute inset-0 size-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
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
