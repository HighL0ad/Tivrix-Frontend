import { useEffect, useState } from "react";
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
import { cn } from "@/shared/lib/utils";

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
  position?: "bottom" | "top" | "left" | "right";
}

export const defaultTourSteps: TourStep[] = [
  {
    targetSelector: '[data-tour="search"]',
    titleKey: "tour.steps.search.title",
    descKey: "tour.steps.search.desc",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="add-product"]',
    titleKey: "tour.steps.addProduct.title",
    descKey: "tour.steps.addProduct.desc",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="nav-finance"]',
    titleKey: "tour.steps.finance.title",
    descKey: "tour.steps.finance.desc",
    position: "right",
  },
  {
    targetSelector: '[data-tour="nav-debts"]',
    titleKey: "tour.steps.debts.title",
    descKey: "tour.steps.debts.desc",
    position: "right",
  },
  {
    targetSelector: '[data-tour="user-profile"]',
    titleKey: "tour.steps.profile.title",
    descKey: "tour.steps.profile.desc",
    position: "top",
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

  useEffect(() => {
    if (!open || !activeStep) return;

    const updateRect = () => {
      const element = document.querySelector(activeStep.targetSelector);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setRect(element.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [open, activeStep, currentStepIndex]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Darkened Overlay Backdrop */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-300" />

      {/* Spotlight Target Highlight Box */}
      {rect && (
        <div
          className="absolute rounded-xl ring-4 ring-sky-400 ring-offset-2 ring-offset-slate-950 shadow-2xl transition-all duration-300 pointer-events-none"
          style={{
            top: `${rect.top - 6}px`,
            left: `${rect.left - 6}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        className="fixed z-50 w-full max-w-md p-4 transition-all duration-300"
        style={{
          top: rect
            ? rect.bottom + 160 > window.innerHeight
              ? Math.max(20, rect.top - 180)
              : rect.bottom + 12
            : "50%",
          left: rect
            ? Math.min(
                Math.max(16, rect.left),
                window.innerWidth - 420,
              )
            : "50%",
          transform: !rect ? "translate(-50%, -50%)" : undefined,
        }}
      >
        <div className="rounded-2xl border border-white/20 bg-[#0f172a] p-5 text-white shadow-2xl backdrop-blur-xl space-y-4">
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
              className="text-slate-400 hover:text-white"
              title={t("common.close")}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">
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
              className="h-8 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              {t("help.prevStep")}
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
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
