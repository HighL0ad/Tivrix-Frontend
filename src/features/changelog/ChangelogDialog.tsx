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

const CURRENT_VERSION = "0.1.0-alpha.1";
const STORAGE_KEY = "ferdi.lastReadVersion";

type ChangelogItem = {
  type: "new" | "update";
  titleKey: string;
  descKey: string;
};

const changelogItems: ChangelogItem[] = [
  {
    type: "new",
    titleKey: "changelog.items.searchHighlight.title",
    descKey: "changelog.items.searchHighlight.desc",
  },
  {
    type: "new",
    titleKey: "changelog.items.inputFormatting.title",
    descKey: "changelog.items.inputFormatting.desc",
  },
  {
    type: "update",
    titleKey: "changelog.items.shimmerLoading.title",
    descKey: "changelog.items.shimmerLoading.desc",
  },
  {
    type: "update",
    titleKey: "changelog.items.timelineBadges.title",
    descKey: "changelog.items.timelineBadges.desc",
  },
];

export function ChangelogDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== CURRENT_VERSION) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    window.localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[480px] p-5 gap-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/60 w-fit px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100 select-none">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>{t("changelog.badge", { version: CURRENT_VERSION })}</span>
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
            {changelogItems.map((item, index) => {
              const isNew = item.type === "new";
              return (
                <div 
                  key={index} 
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-slate-50/30 p-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {isNew ? (
                      <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-emerald-100 text-[9px] font-black text-emerald-800 uppercase tracking-wide select-none">
                        NEW
                      </span>
                    ) : (
                      <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-blue-100 text-[9px] font-black text-blue-800 uppercase tracking-wide select-none">
                        UPD
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground leading-snug">
                      {t(item.titleKey)}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t(item.descKey)}
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
            <span>Ferdi Telefon ERP · v{CURRENT_VERSION}</span>
          </div>
          <Button 
            onClick={handleClose}
            className="w-full sm:w-auto h-9 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 transition-transform"
          >
            <Check className="size-4 mr-1.5" />
            {t("changelog.closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
