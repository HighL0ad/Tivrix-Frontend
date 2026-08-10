import { type CSSProperties, useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  SearchX,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
  route?: string;
}

interface TargetRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

const topicTours: Record<string, TourStep[]> = {
  "quick-start": [
    {
      route: "/finance",
      targetSelector: '[data-tour="finance-wallets"], [data-tour="nav-finance"]',
      titleKey: "tour.steps.quickStart.step1Title",
      descKey: "tour.steps.quickStart.step1Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-imei-field"], [data-tour="product-form-main"], [data-tour="add-product"]',
      titleKey: "tour.steps.quickStart.step2Title",
      descKey: "tour.steps.quickStart.step2Desc",
    },
    {
      route: "/clients",
      targetSelector: '[data-tour="clients-create"], [data-tour="nav-clients"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.quickStart.step3Title",
      descKey: "tour.steps.quickStart.step3Desc",
    },
    {
      route: "/users",
      targetSelector: '[data-tour="users-create"], [data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.quickStart.step4Title",
      descKey: "tour.steps.quickStart.step4Desc",
    },
  ],
  "product-create": [
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-scenario"], [data-tour="product-form-main"]',
      titleKey: "tour.steps.productCreate.step1Title",
      descKey: "tour.steps.productCreate.step1Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-name-field"], [data-tour="product-main-data"]',
      titleKey: "tour.steps.productCreate.step2Title",
      descKey: "tour.steps.productCreate.step2Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-imei-field"], [data-tour="product-main-data"]',
      titleKey: "tour.steps.productCreate.step3Title",
      descKey: "tour.steps.productCreate.step3Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-imei2-field"], [data-tour="product-main-data"]',
      titleKey: "tour.steps.productCreate.step4Title",
      descKey: "tour.steps.productCreate.step4Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-phone-field"], [data-tour="product-main-data"]',
      titleKey: "tour.steps.productCreate.step5Title",
      descKey: "tour.steps.productCreate.step5Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-buy-price-field"], [data-tour="product-main-data"]',
      titleKey: "tour.steps.productCreate.step6Title",
      descKey: "tour.steps.productCreate.step6Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-registration"], [data-tour="product-form-main"]',
      titleKey: "tour.steps.productCreate.step7Title",
      descKey: "tour.steps.productCreate.step7Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-photo"], [data-tour="product-form-main"]',
      titleKey: "tour.steps.productCreate.step8Title",
      descKey: "tour.steps.productCreate.step8Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-source-field"], [data-tour="product-payment"]',
      titleKey: "tour.steps.productCreate.step9Title",
      descKey: "tour.steps.productCreate.step9Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-payment-options"], [data-tour="product-payment"]',
      titleKey: "tour.steps.productCreate.step10Title",
      descKey: "tour.steps.productCreate.step10Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-summary"], [data-tour="product-form-main"]',
      titleKey: "tour.steps.productCreate.step11Title",
      descKey: "tour.steps.productCreate.step11Desc",
    },
  ],
  "imei-management": [
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-imei-field"], [data-tour="product-form-main"], [data-tour="add-product"]',
      titleKey: "tour.steps.imei.step1Title",
      descKey: "tour.steps.imei.step1Desc",
    },
    {
      route: "/products/new",
      targetSelector: '[data-tour="product-registration"], [data-tour="product-form-main"], [data-tour="add-product"]',
      titleKey: "tour.steps.imei.step2Title",
      descKey: "tour.steps.imei.step2Desc",
    },
    {
      route: "/products",
      targetSelector: '[data-tour="products-search"], [data-tour="search"]',
      titleKey: "tour.steps.imei.step3Title",
      descKey: "tour.steps.imei.step3Desc",
    },
  ],
  "installment-system": [
    {
      route: "/products",
      targetSelector: '[data-tour="products-list"], [data-tour="add-product"]',
      titleKey: "tour.steps.installments.step1Title",
      descKey: "tour.steps.installments.step1Desc",
    },
    {
      route: "/debts?tab=installments",
      targetSelector: '[data-tour="installments-dashboard"], [data-tour="debts-tabs"], [data-tour="nav-debts"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.installments.step2Title",
      descKey: "tour.steps.installments.step2Desc",
    },
    {
      route: "/clients?filter=debt",
      targetSelector: '[data-tour="clients-list"], [data-tour="clients-filters"], [data-tour="nav-clients"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.installments.step3Title",
      descKey: "tour.steps.installments.step3Desc",
    },
  ],
  "cash-and-finance": [
    {
      route: "/finance",
      targetSelector: '[data-tour="finance-wallets"], [data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step1Title",
      descKey: "tour.steps.finance.step1Desc",
    },
    {
      route: "/finance",
      targetSelector: '[data-tour="finance-adjust-wallet"], [data-tour="finance-wallets"], [data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step2Title",
      descKey: "tour.steps.finance.step2Desc",
    },
    {
      route: "/finance",
      targetSelector: '[data-tour="finance-transfer"], [data-tour="finance-actions"], [data-tour="nav-finance"]',
      titleKey: "tour.steps.finance.step3Title",
      descKey: "tour.steps.finance.step3Desc",
    },
  ],
  "staff-and-roles": [
    {
      route: "/users",
      targetSelector: '[data-tour="users-create"], [data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.users.step1Title",
      descKey: "tour.steps.users.step1Desc",
    },
    {
      route: "/users",
      targetSelector: '[data-tour="users-list"], [data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.users.step2Title",
      descKey: "tour.steps.users.step2Desc",
    },
    {
      route: "/users",
      targetSelector: '[data-tour="users-list"], [data-tour="nav-users"], [data-tour="mobile-more"]',
      titleKey: "tour.steps.users.step3Title",
      descKey: "tour.steps.users.step3Desc",
    },
  ],
};

export function SpotlightTour({
  open,
  topicId = "quick-start",
  accessiblePaths,
  onClose,
}: {
  open: boolean;
  topicId?: string;
  accessiblePaths?: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const maskId = `spotlight-mask-${useId().replace(/:/g, "")}`;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const steps = useMemo(() => {
    const topicSteps = topicTours[topicId] ?? topicTours["quick-start"];
    if (!accessiblePaths) return topicSteps;

    return topicSteps.filter((step) => {
      if (!step.route) return true;
      const routePath = step.route.split("?")[0];
      return accessiblePaths.some(
        (path) => routePath === path || routePath.startsWith(`${path}/`),
      );
    });
  }, [accessiblePaths, topicId]);
  const activeStep = steps[currentStepIndex];
  const currentRoute = `${location.pathname}${location.search}`;

  const updateTargetRect = useCallback((scrollToTarget = false, showMissing = true) => {
    if (!activeStep) return;
    const visibleEl = findTourTarget(activeStep.targetSelector);

    if (visibleEl) {
      setTargetMissing(false);

      if (scrollToTarget) {
        centerElementInViewport(visibleEl);
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
      return visibleEl;
    } else {
      setRect(null);
      if (showMissing) setTargetMissing(true);
      return null;
    }
  }, [activeStep]);

  useEffect(() => {
    if (!open) {
      setCurrentStepIndex(0);
      setRect(null);
      setTargetMissing(false);
      return;
    }
    if (!activeStep) return;

    if (activeStep.route && currentRoute !== activeStep.route) {
      setRect(null);
      setTargetMissing(false);
      navigate(activeStep.route);
      return;
    }

    let targetLocated = false;
    let retryTimer: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const observeTarget = (element: HTMLElement) => {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => updateTargetRect());
      resizeObserver.observe(element);
    };
    const locateTarget = (showMissing = false) => {
      const element = updateTargetRect(!targetLocated, showMissing);
      if (element && !targetLocated) {
        targetLocated = true;
        observeTarget(element);
        if (retryTimer !== null) {
          window.clearInterval(retryTimer);
          retryTimer = null;
        }
      }
    };

    const initialTimer = window.setTimeout(() => locateTarget(false), 80);
    const missingTimer = window.setTimeout(() => locateTarget(true), 1_200);
    retryTimer = window.setInterval(() => locateTarget(false), 500);
    const stopRetryTimer = window.setTimeout(
      () => {
        if (retryTimer !== null) window.clearInterval(retryTimer);
      },
      8_000,
    );

    const handleResizeOrScroll = () => {
      updateTargetRect();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(missingTimer);
      window.clearTimeout(stopRetryTimer);
      if (retryTimer !== null) window.clearInterval(retryTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [activeStep, currentRoute, navigate, open, currentStepIndex, updateTargetRect]);

  useEffect(() => {
    if (open && !activeStep) onClose();
  }, [activeStep, onClose, open]);

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
  const spotlightRect = rect ? getSpotlightRect(rect) : null;

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
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
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

      {spotlightRect && (
        <div
          className="fixed rounded-xl ring-2 ring-sky-300 ring-offset-4 ring-offset-slate-950/90 shadow-[0_0_0_1px_rgba(14,165,233,0.25),0_12px_36px_rgba(14,165,233,0.35)] transition-all duration-500 ease-out pointer-events-none z-[100] motion-reduce:transition-none"
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
          }}
        />
      )}

      <div
        className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[360px] overflow-y-auto transition-all duration-500 ease-out pointer-events-auto motion-reduce:transition-none"
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
              {stripStepNumber(t(activeStep.titleKey))}
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

function findTourTarget(targetSelector: string) {
  const selectors = targetSelector
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const visibleElement = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });
    if (visibleElement) return visibleElement;
  }

  return null;
}

function getSpotlightRect(rect: TargetRect): TargetRect {
  const padding = 8;
  const left = clamp(rect.left - padding, padding, window.innerWidth - padding);
  const top = clamp(rect.top - padding, padding, window.innerHeight - padding);
  const right = clamp(rect.right + padding, padding, window.innerWidth - padding);
  const bottom = clamp(rect.bottom + padding, padding, window.innerHeight - padding);

  return {
    top,
    left,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function getTooltipPosition(rect: TargetRect | null): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 16;
  const gap = 16;
  const cardWidth = Math.min(360, viewportWidth - margin * 2);
  const estimatedCardHeight = 240;

  if (!rect || rect.width <= 0 || viewportWidth < 640) {
    return {
      left: margin,
      bottom: margin,
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

function centerElementInViewport(element: HTMLElement) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
    inline: "center",
  });
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function stripStepNumber(value: string) {
  return value.replace(/^\s*\d+\.\s*/, "");
}
