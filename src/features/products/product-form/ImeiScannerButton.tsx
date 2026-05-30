import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Scan, X, Camera, RefreshCw } from "lucide-react";

import { useImeiScanner } from "@/features/products/product-form/useImeiScanner";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface ImeiScannerButtonProps {
  onScan: (imei: string) => void;
}

export function ImeiScannerButton({ onScan }: ImeiScannerButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const scanner = useImeiScanner({
    onScanSuccess: (imeis) => {
      try {
        if ("vibrate" in navigator) {
          navigator.vibrate(150);
        }
      } catch (e) {}

      if (imeis.length > 0) {
        onScan(imeis[0]);
      }

      setOpen(false);
    },
    onScanError: (err) => {
      console.error(err);
    },
  });

  const showLoading = scanner.isInitializing || scanner.isCameraLoading;

  const ModalContainer = isMobile ? Sheet : Dialog;
  const ModalContent = isMobile ? SheetContent : DialogContent;

  return (
    <ModalContainer open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 size-8 rounded-md shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          title={t("products.scanImei")}
        >
          <Scan className="size-4.5" />
          <span className="sr-only">{t("products.scanImei")}</span>
        </Button>
      </DialogTrigger>

      <ModalContent
        showCloseButton={false}
        className={
          isMobile
            ? "bg-slate-950 text-white border-slate-900 p-0 overflow-hidden select-none rounded-t-2xl border-t"
            : "max-w-md bg-slate-950 text-white border-slate-900 p-0 overflow-hidden select-none shadow-2xl rounded-2xl"
        }
      >
        <div className="relative flex flex-col items-center p-6 text-center">
          <DialogHeader className="w-full border-b border-slate-900 pb-3 mb-4 text-left">
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Camera className="size-5 text-sky-400" />
              {t("products.scanImei")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("products.scanImei")}
            </DialogDescription>
          </DialogHeader>

          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-slate-400 hover:text-white hover:bg-slate-900 absolute top-4 right-4"
              />
            }
          >
              <X className="size-4" />
              <span className="sr-only">Close</span>
          </DialogClose>

          <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800/80">
            {open && (
              <div
                ref={scanner.videoRef}
                className="absolute inset-0 w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_canvas]:hidden [&_#qr-shaded-region]:!hidden"
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative w-[88%] max-w-[360px] h-[84px] sm:h-[96px] rounded-lg border border-white/25 bg-black/10">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-sky-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />

                <div className="absolute left-2 right-2 top-2 h-px bg-red-500/80 shadow-[0_0_12px_#ef4444] motion-safe:animate-[imei-scan-line_1.8s_ease-in-out_infinite]" />
              </div>
            </div>

            <style>{`
              @keyframes imei-scan-line {
                0%, 100% { transform: translateY(0); opacity: 0.55; }
                50% { transform: translateY(64px); opacity: 1; }
              }
            `}</style>

            {showLoading && (
              <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <RefreshCw className="size-6 animate-spin text-sky-400" />
                <span>{t("common.loading")}</span>
              </div>
            )}

            {scanner.error && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center gap-2">
                <span className="text-red-400 font-bold">
                  {t("common.operationFailed")}
                </span>
                <span className="text-xs text-slate-400 max-w-[250px]">
                  {scanner.error}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-slate-700 text-slate-300 hover:text-white"
                  onClick={scanner.refetchDevices}
                >
                  {t("common.reset")}
                </Button>
              </div>
            )}
          </div>

          <div className="w-full mt-4 space-y-3">
            <p className="mt-4 text-sm text-white/70 text-center font-medium">
              {t("ru") === "ru"
                ? "Поднесите коробку ближе к камере"
                : "Qutunu kameraya daha yaxın gətirin"}
            </p>

            {scanner.scanStatus === "code-found" ? (
              <Alert
                variant="warning"
                className="border-amber-500/20 bg-amber-500/10 text-amber-200"
              >
                <AlertDescription className="text-center text-amber-200">
                  {t("ru") === "ru"
                    ? "Код считан, но IMEI не найден. Наведи на IMEI/MEID штрихкод."
                    : "Kod oxundu, amma IMEI tapılmadı. IMEI/MEID ştrix-kodunu göstər."}
                </AlertDescription>
              </Alert>
            ) : scanner.scanStatus === "scanning" ? (
              <DialogDescription className="text-center text-xs font-medium text-slate-500">
                {t("ru") === "ru"
                  ? "Камера активна, ищу штрихкод..."
                  : "Kamera aktivdir, ştrix-kod axtarılır..."}
              </DialogDescription>
            ) : null}

            {scanner.devices.length > 1 && (
              <div className="flex justify-center gap-2 w-full max-w-[260px] mx-auto">
                <Select
                  value={scanner.selectedDeviceId}
                  onValueChange={scanner.setSelectedDeviceId}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    {scanner.devices.map((device, index) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </ModalContent>
    </ModalContainer>
  );
}
