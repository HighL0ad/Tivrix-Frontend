import type { ReactNode } from "react";

import { AppFormField } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";

import { registrationOptions } from "./model";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <AppFormField label={label}>
      {children}
    </AppFormField>
  );
}

export function InlineCreate({
  value,
  onChange,
  onCreate,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 flex items-start gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-card !text-base font-medium leading-5 placeholder:!text-base placeholder:font-medium placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 !text-base font-medium"
        onClick={onCreate}
        disabled={disabled || !value.trim()}
      >
        <span className="text-base font-medium leading-5">Создать</span>
      </Button>
    </div>
  );
}

export function InfoBox({
  color,
  title,
  children,
}: {
  color: "red" | "green";
  title: string;
  children: ReactNode;
}) {
  const classes =
    color === "red"
      ? "border-red-200 text-red-700"
      : "border-green-200 text-green-700";

  return (
    <div className={`rounded-lg border bg-background p-4 ${classes}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-gray-500">{children}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function RegistrationCheckboxGroup({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {registrationOptions.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 text-muted-foreground transition hover:border-border hover:bg-background"
        >
          <Checkbox
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => {
              onChange(
                checked
                  ? [...value, option.value]
                  : value.filter((current) => current !== option.value),
              );
            }}
            className="size-5"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
