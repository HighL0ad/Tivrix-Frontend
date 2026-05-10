import { ArrowLeft } from "lucide-react";
import { NavLink } from "react-router";

import { Button } from "@/shared/ui/button";

export function BackButton({
  to,
  label = "Назад",
  state,
}: {
  to: string;
  label?: string;
  state?: unknown;
}) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <NavLink to={to} state={state}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {label}
      </NavLink>
    </Button>
  );
}
