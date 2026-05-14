import { ArrowLeft } from "lucide-react";
import { NavLink } from "react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export function BackButton({
  to,
  label,
  state,
}: {
  to: string;
  label?: string;
  state?: unknown;
}) {
  const { t } = useTranslation();

  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <NavLink to={to} state={state}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {label ?? t("common.back")}
      </NavLink>
    </Button>
  );
}

export function BackActionButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`gap-2 ${className ?? ""}`}
      onClick={onClick}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label ?? t("common.back")}
    </Button>
  );
}
