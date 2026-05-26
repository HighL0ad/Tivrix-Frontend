import { Check, ChevronsUpDown, Plus, Upload, X } from "lucide-react";
import * as RadixPopover from "@radix-ui/react-popover";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

export type AppOption = {
  id: string;
  name: string;
};

const selectedControlTextClassName =
  "min-w-0 flex-1 truncate text-left text-base md:text-sm font-medium leading-5";

export function AppFormField({
  label,
  children,
  error,
  helper,
}: {
  label: string;
  children: ReactNode;
  error?: string | null;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-medium text-foreground">{label}</Label>
      {children}
      {helper ? (
        <p className="text-[13px] leading-5 text-muted-foreground">{helper}</p>
      ) : null}
      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: AppOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const selectPlaceholder = placeholder ?? t("common.select");
  const selectedOption = options.find((option) => option.id === value);
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          className={cn(
          "h-11 md:h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-9 text-left text-base md:text-sm font-medium leading-5 text-foreground outline-none transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          {!selectedOption ? (
            <option value="" disabled>
              {selectPlaceholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("h-11 md:h-10", className)}>
        <span
          className={cn(
            selectedControlTextClassName,
            !selectedOption && "text-muted-foreground",
          )}
        >
          {selectedOption?.name ?? selectPlaceholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AppCombobox({
  value,
  onValueChange,
  onSearchChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  loading,
  className,
  onCreateNew,
  createNewFormat,
  clearable,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange?: (value: string) => void;
  options: AppOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onCreateNew?: (query: string) => void;
  createNewFormat?: string;
  clearable?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value),
    [options, value],
  );

  const hasExactMatch = useMemo(() => {
    const trimmed = internalSearchQuery.trim().toLowerCase();
    if (!trimmed) return true;
    return options.some((opt) => opt.name.toLowerCase() === trimmed);
  }, [options, internalSearchQuery]);

  const displayedOptions = useMemo(() => {
    if (!onCreateNew || !internalSearchQuery.trim() || hasExactMatch) {
      return options;
    }
    const query = internalSearchQuery.trim();
    const resolvedName = createNewFormat
      ? createNewFormat.replace("{{name}}", query)
      : t("common.createNew", { name: query });

    const newOption: AppOption = {
      id: `NEW_ACTION:${query}`,
      name: resolvedName,
    };
    return [...options, newOption];
  }, [options, onCreateNew, internalSearchQuery, hasExactMatch, createNewFormat, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setInternalSearchQuery("");
    }
  };
  const canClear = clearable && Boolean(value) && !disabled && !loading;
  const clearValue = () => {
    onValueChange("");
    setInternalSearchQuery("");
    setOpen(false);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading}
          aria-expanded={open}
          onKeyDown={(event) => {
            if (!canClear) return;
            if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              clearValue();
            }
          }}
          className={cn(
            "h-11 md:h-10 w-full justify-between bg-card px-3 text-left text-base md:text-sm font-medium shadow-none hover:bg-card",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className={selectedControlTextClassName}>
            {loading ? t("common.loading") : selectedOption?.name ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-32px)] rounded-lg border bg-card p-0 shadow-lg"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder ?? t("common.search")}
              onValueChange={(val) => {
                setInternalSearchQuery(val);
                onSearchChange?.(val);
              }}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>{emptyMessage ?? t("common.noResults")}</CommandEmpty>
              <CommandGroup>
                {displayedOptions.map((option) => {
                  const isNew =
                    option.id.startsWith("NEW:") ||
                    option.id.startsWith("NEW_ACTION:") ||
                    option.id === "NEW_CLIENT";
                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.name} ${option.id}`}
                      onSelect={() => {
                        if (option.id.startsWith("NEW_ACTION:")) {
                          const query = option.id.substring("NEW_ACTION:".length);
                          onCreateNew?.(query);
                        } else {
                          onValueChange(option.id);
                        }
                        setOpen(false);
                      }}
                      className={cn(
                        isNew && "mt-1.5 mb-0.5 font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/15 hover:bg-sky-500/20 dark:hover:bg-sky-500/20 data-[selected=true]:bg-sky-500/20 dark:data-[selected=true]:bg-sky-500/20 data-[selected=true]:text-sky-700 dark:data-[selected=true]:text-sky-300 border border-dashed border-sky-300/60 dark:border-sky-800/80 rounded-lg"
                      )}
                    >
                      {isNew ? (
                        <Plus className="size-4 text-sky-500 dark:text-sky-400 shrink-0" />
                      ) : (
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            option.id === value ? "opacity-100" : "opacity-0",
                          )}
                        />
                      )}
                      <span className="truncate">{option.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export function AppFileUpload({
  value,
  onChange,
  label,
  accept,
  multiple = false,
}: {
  value: File | File[] | null;
  onChange: (file: File | File[] | null) => void;
  label?: string;
  accept?: string;
  multiple?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadLabel = label ?? t("common.uploadFile");
  const files = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  const [previewUrls, setPreviewUrls] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));

    setPreviewUrls(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  function handleFiles(nextFiles: FileList | null) {
    const selected = Array.from(nextFiles ?? []);
    onChange(multiple ? selected : selected[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}
      >
        {previewUrls[0] ? (
          <img src={previewUrls[0].url} alt="" className="size-12 rounded-lg object-cover" />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
            <Upload className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium leading-5 text-foreground">
            {uploadLabel}
          </span>
          <span className="block break-words text-[13px] leading-5 text-gray-500">
            {files.length ? files.map((file) => file.name).join(", ") : t("common.fileNotSelected")}
          </span>
        </span>
      </button>
      {previewUrls.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {previewUrls.map((preview) => (
            <img
              key={preview.url}
              src={preview.url}
              alt={preview.name}
              className="aspect-square rounded-lg border object-cover"
            />
          ))}
        </div>
      ) : null}
      {files.length ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(multiple ? [] : null)}>
          <X className="size-4" />
          {multiple ? t("common.deleteFiles") : t("common.deleteFile")}
        </Button>
      ) : null}
    </div>
  );
}

export function AppSection({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-gray-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
      <Separator />
    </section>
  );
}

export function AppModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex justify-end border-t bg-muted/30 px-6 py-4 [&>button]:w-full sm:[&>button]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ResponsiveModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Root = isMobile ? Sheet : Dialog;
  const Trigger = isMobile ? SheetTrigger : DialogTrigger;
  const Content = isMobile ? SheetContent : DialogContent;
  const Header = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;
  const Description = isMobile ? SheetDescription : DialogDescription;

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Trigger asChild>{trigger}</Trigger>
      <Content
        className={cn(
          "grid max-h-[90dvh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl md:max-w-xl",
          isMobile && "h-[92dvh] rounded-t-2xl rounded-b-none",
          className,
        )}
      >
        <Header className="border-b border-border bg-card px-6 py-5">
          <Title className="text-base font-black text-foreground">{title}</Title>
          {description ? <Description>{description}</Description> : null}
        </Header>
        <div className="min-h-0 overflow-y-auto bg-card px-6 py-5">{children}</div>
        {footer ? <AppModalFooter>{footer}</AppModalFooter> : null}
      </Content>
    </Root>
  );
}

export function AppDialog(props: ComponentProps<typeof ResponsiveModal>) {
  return <ResponsiveModal {...props} />;
}

export function AppRadioCards<TValue extends string>({
  value,
  onValueChange,
  options,
}: {
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: Array<{ value: TValue; label: string; description?: string }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "min-h-16 rounded-lg border bg-card px-4 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:bg-muted/50",
            )}
            onClick={() => onValueChange(option.value)}
          >
            <span className="block text-[13px] font-bold leading-5">
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
