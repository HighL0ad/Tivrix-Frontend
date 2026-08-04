import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  CURRENT_CHANGELOG_VERSION,
  getChangelogLocale,
  getCurrentChangelogItems,
} from "@/features/changelog/changelog-data";

const STORAGE_KEY = "tivrix.lastReadVersion";

export function ChangelogDialog() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = getChangelogLocale(i18n.language);
  const activeItems = getCurrentChangelogItems();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== CURRENT_CHANGELOG_VERSION && activeItems.length > 0) {
      setOpen(true);
    }
  }, [activeItems.length]);

  const handleClose = () => {
    window.localStorage.setItem(STORAGE_KEY, CURRENT_CHANGELOG_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[480px] p-5 gap-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20 w-fit px-2.5 py-1 rounded-full text-xs font-bold border border-sky-100 dark:border-sky-500/20 select-none">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>{t("changelog.badge", { version: CURRENT_CHANGELOG_VERSION })}</span>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-foreground mt-2 leading-tight">
            {t("changelog.title")}
          </DialogTitle>
          <DialogDescription className="text-xs leading-normal text-muted-foreground mt-1.5">
            {t("changelog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-2.5" type="scroll">
          <div className="space-y-3 pr-1.5 pb-1">
            {activeItems.map((item, index) => {
              const isNew = item.type === "new";
              return (
                <div 
                  key={index} 
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/65 transition-colors p-3"
                >
                  <div className="mt-0.5 shrink-0">
                    {isNew ? (
                      <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-[9px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide select-none">
                        NEW
                      </span>
                    ) : (
                      <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/40 text-[9px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide select-none">
                        UPD
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground leading-snug">
                      {item.title[locale]}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {item.description[locale]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-2 sm:justify-between sm:flex-row gap-3 items-center">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 select-none">
            <span className="relative flex h-2 w-2 items-center justify-center shrink-0 -translate-y-[0.5px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Tivrix · v{CURRENT_CHANGELOG_VERSION}</span>
          </div>
          <Button 
            onClick={handleClose}
            className="w-full sm:w-auto h-9 font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm active:scale-95 transition-transform"
          >
            <Check className="size-4 mr-1.5" />
            {t("changelog.closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
