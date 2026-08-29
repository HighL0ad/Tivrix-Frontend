import { useEffect, useState } from "react";
import { Check } from "lucide-react";
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
      <DialogContent className="max-h-[94dvh] gap-4 overflow-hidden rounded-t-lg rounded-b-none border border-border/80 bg-card p-5 pt-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg sm:max-w-[480px] sm:rounded-lg sm:pt-5 sm:pb-5">
        <DialogHeader className="gap-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("changelog.badge", { version: CURRENT_CHANGELOG_VERSION })}
          </p>
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
                      <span className="inline-flex h-5 w-10 items-center text-[10px] font-semibold text-foreground select-none">
                        NEW
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-10 items-center text-[10px] font-semibold text-muted-foreground select-none">
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
          <div className="flex items-center text-[10px] font-medium text-muted-foreground select-none">
            <span>Tivrix · v{CURRENT_CHANGELOG_VERSION}</span>
          </div>
          <Button 
            onClick={handleClose}
            className="h-9 w-full bg-sky-600 font-bold text-white shadow-none transition-colors hover:bg-sky-500 sm:w-auto"
          >
            <Check className="size-4 mr-1.5" />
            {t("changelog.closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
