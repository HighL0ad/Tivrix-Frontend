import {
  BadgeAlert,
  BadgeCheck,
  CreditCard,
  FileQuestion,
  Home,
  ShieldX,
} from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { getRegistrationLabel } from "./format";

const registrationMeta: Record<
  string,
  { className: string; icon: typeof BadgeCheck }
> = {
  registered: {
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icon: BadgeCheck,
  },
  unregistered: {
    className: "border-red-100 bg-red-50 text-red-700",
    icon: ShieldX,
  },
  no_declaration: {
    className: "border-orange-100 bg-orange-50 text-orange-700",
    icon: FileQuestion,
  },
  own_property: {
    className: "border-blue-100 bg-blue-50 text-blue-700",
    icon: Home,
  },
  credit: {
    className: "border-indigo-100 bg-indigo-50 text-indigo-700",
    icon: CreditCard,
  },
  mismatch: {
    className: "border-amber-100 bg-amber-50 text-amber-700",
    icon: BadgeAlert,
  },
};

export function RegistrationBadges({ statuses }: { statuses: string[] }) {
  if (statuses.length === 0) {
    return (
      <div className="mt-2">
        <Badge variant="outline" className="text-muted-foreground">
          Регистрация: -
        </Badge>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {statuses.map((status) => {
        const meta = registrationMeta[status] ?? {
          className: "border-gray-200 bg-gray-50 text-gray-700",
          icon: FileQuestion,
        };
        const Icon = meta.icon;

        return (
          <Badge
            key={status}
            variant="outline"
            className={`gap-1.5 ${meta.className}`}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            Рег: {getRegistrationLabel(status)}
          </Badge>
        );
      })}
    </div>
  );
}
