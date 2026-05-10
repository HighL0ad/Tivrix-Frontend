import { type ReactNode } from "react";

import { AppFormField } from "@/shared/ui/app-form";

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <AppFormField label={label}>
      {children}
    </AppFormField>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}
