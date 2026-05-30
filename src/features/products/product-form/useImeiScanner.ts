import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UseImeiScannerProps {
  onScanSuccess: (imeis: string[]) => void;
  onScanError?: (error: Error) => void;
}

export type ImeiScanStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "code-found"
  | "imei-found";

interface ScannerDevice {
  deviceId: string;
  label: string;
}

// ─── IMEI helpers (unchanged) ─────────────────────────────────────────────────

export function validateLuhn(imei: string): boolean {
  const cleaned = imei.replace(/\D/g, "");
  if (cleaned.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function extractImeiCandidates(text: string): string[] {
  const onlyDigits = text.replace(/\D/g, "");
  const candidates = new Set<string>();
  (text.match(/\b\d{15}\b/g) ?? []).forEach((v) => candidates.add(v));
  (text.match(/\d{15}/g) ?? []).forEach((v) => candidates.add(v));
  for (let i = 0; i <= onlyDigits.length - 15; i++) {
    candidates.add(onlyDigits.slice(i, i + 15));
  }
  return Array.from(candidates);
}

export function extractValidImeis(text: string): string[] {
  return extractImeiCandidates(text).filter(validateLuhn);
}

// ─── Camera helpers (unchanged) ───────────────────────────────────────────────

function getBackCameraDevices(devices: ScannerDevice[]) {
  return devices.filter(({ label }) => {
    const l = label.toLowerCase();
    return !(
      l.includes("front") ||
      l.includes("selfie") ||
      l.includes("передняя") ||
      l.includes("фронтальная")
    );
  });
}

function getCameraScore({ label }: ScannerDevice) {
  const l = label.toLowerCase();
  let score = 0;
  if (l.includes("back") || l.includes("rear")) score += 50;
  if (l.includes("environment") || l.includes("основная")) score += 50;
  if (l.includes("wide") && !l.includes("ultra")) score += 12;
  if (l.includes("dual") || l.includes("triple")) score += 8;
  if (l.includes("ultra")) score -= 20;
  if (l.includes("telephoto")) score -= 12;
  if (l.includes("front") || l.includes("selfie")) score -= 100;
  return score;
}

function sortCameras(devices: ScannerDevice[]) {
  return [...devices].sort((a, b) => {
    const diff = getCameraScore(b) - getCameraScore(a);
    return diff !== 0 ? diff : a.label.localeCompare(b.label);
  });
}

function pickBestCamera(devices: ScannerDevice[]) {
  const back = getBackCameraDevices(devices);
  return sortCameras(back.length > 0 ? back : devices)[0];
}

// ─── ZXing reader factory ─────────────────────────────────────────────────────
// FIX: каждый раз создаём новый экземпляр reader — ZXing не поддерживает
// повторный запуск одного и того же экземпляра после stop().

function createReader() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, {
    // Пауза между попытками декодирования кадров (мс)
    delayBetweenScanAttempts: 100,
    // FIX: большое значение — ZXing продолжает сканировать непрерывно
    // после успешного результата, не останавливается.
    // Нашу дедупликацию (pendingScanRef) это не ломает — она работает
    // на уровне колбэка независимо от этого таймера.
    delayBetweenScanSuccess: 500,
  });
}

// ─── Camera zoom/focus tuning ────────────────────────────────────────────────

type TunableCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: { min?: number; max?: number; step?: number };
};
type TunableSettings = MediaTrackSettings & { zoom?: number };

async function tuneCameraForBarcode(videoEl: HTMLVideoElement) {
  try {
    const stream = videoEl.srcObject;
    if (!(stream instanceof MediaStream)) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities() as TunableCapabilities;
    const settings = track.getSettings() as TunableSettings;
    const advanced: MediaTrackConstraintSet[] = [];

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({
        focusMode: "continuous",
      } as unknown as MediaTrackConstraintSet);
    }
    if (capabilities.zoom?.max && capabilities.zoom.max > 1) {
      const current = settings.zoom ?? capabilities.zoom.min ?? 1;
      const target = Math.min(capabilities.zoom.max, Math.max(current, 2));
      advanced.push({ zoom: target } as unknown as MediaTrackConstraintSet);
    }
    if (advanced.length > 0) {
      await track.applyConstraints({ advanced });
    }
  } catch (err) {
    console.warn("[IMEI SCANNER] Failed to tune camera", err);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useImeiScanner({
  onScanSuccess,
  onScanError,
}: UseImeiScannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // FIX: храним controls и reader отдельно.
  // controls.stop() останавливает декодирование и камеру.
  // После stop() reader нельзя переиспользовать — нужен новый экземпляр.
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  // FIX: флаг активной сессии — защита от гонки при быстром
  // закрытии/открытии модала пока await reader.decodeFromConstraints ещё не
  // разрешился.
  const sessionRef = useRef<symbol | null>(null);

  const lastScannedRef = useRef<string>("");
  const pendingScanRef = useRef<{ key: string; count: number }>({
    key: "",
    count: 0,
  });

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [devices, setDevices] = useState<ScannerDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<ImeiScanStatus>("idle");

  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  // videoRef — та же сигнатура что раньше, ImeiScannerButton не трогаем
  const videoRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setContainerEl(element);
  }, []);

  // Гарантируем наличие <video> внутри контейнера
  const ensureVideoEl = useCallback((): HTMLVideoElement => {
    const container = containerRef.current!;
    let video = container.querySelector<HTMLVideoElement>("video");
    if (!video) {
      video = document.createElement("video");
      video.style.cssText =
        "width:100%;height:100%;object-fit:cover;display:block;";
      video.setAttribute("playsinline", "");
      video.muted = true;
      container.appendChild(video);
    }
    videoElRef.current = video;
    return video;
  }, []);

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stopScanning = useCallback(() => {
    // Инвалидируем текущую сессию — если startScanning ещё в полёте,
    // он проверит этот флаг и не установит controls.
    sessionRef.current = null;

    try {
      controlsRef.current?.stop();
    } catch {
      // ignore — stop() иногда бросает если поток уже закрыт
    }
    controlsRef.current = null;

    setIsCameraLoading(false);
    setScanStatus("idle");
  }, []);

  // ── Load devices ──────────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    setIsInitializing(true);
    setError("");
    try {
      const raw = await BrowserMultiFormatReader.listVideoInputDevices();
      const allDevices: ScannerDevice[] = raw.map((d) => ({
        deviceId: d.deviceId,
        label: d.label,
      }));
      const back = getBackCameraDevices(allDevices);
      setDevices(sortCameras(back.length > 0 ? back : allDevices));
      const best = pickBestCamera(allDevices);
      setSelectedDeviceId(best?.deviceId ?? "");
    } catch (err) {
      console.warn("[IMEI SCANNER] Failed to list devices", err);
      setSelectedDeviceId("");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startScanning = useCallback(async () => {
    if (!containerEl) return;

    // Останавливаем предыдущую сессию
    stopScanning();

    // Создаём токен для этой сессии
    const session = Symbol("scan-session");
    sessionRef.current = session;

    lastScannedRef.current = "";
    pendingScanRef.current = { key: "", count: 0 };
    setIsCameraLoading(true);
    setScanStatus("starting");
    setError("");

    const videoEl = ensureVideoEl();

    // FIX: новый reader на каждый запуск — ZXing не позволяет
    // повторно использовать один экземпляр после stop()
    const reader = createReader();

    const videoConstraints: MediaTrackConstraints = selectedDeviceId
      ? { deviceId: { exact: selectedDeviceId } }
      : { facingMode: "environment" };

    try {
      const controls = await reader.decodeFromConstraints(
        { video: videoConstraints },
        videoEl,
        (result, err) => {
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[IMEI SCANNER] frame error", err);
          }
          if (!result) return;

          const decoded = result.getText();
          const validImeis = extractValidImeis(decoded);
          const candidates = extractImeiCandidates(decoded);
          const accepted =
            validImeis.length > 0
              ? validImeis
              : candidates.filter((c) => c.length === 15);

          setScanStatus(accepted.length > 0 ? "imei-found" : "code-found");
          if (accepted.length === 0) return;

          const key = accepted.join(",");
          if (lastScannedRef.current === key) return;

          if (pendingScanRef.current.key === key) {
            pendingScanRef.current.count += 1;
          } else {
            pendingScanRef.current = { key, count: 1 };
          }

          if (pendingScanRef.current.count < 2) return;

          lastScannedRef.current = key;
          onScanSuccessRef.current(accepted);
        },
      );

      // FIX: проверяем, что сессия ещё актуальна — пользователь мог
      // закрыть модал пока decodeFromConstraints ещё резолвился
      if (sessionRef.current !== session) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      await tuneCameraForBarcode(videoEl);
      setIsCameraLoading(false);
      setScanStatus("scanning");
    } catch (err) {
      if (sessionRef.current !== session) return; // уже остановлено
      setIsCameraLoading(false);
      setScanStatus("idle");
      const message =
        err instanceof Error ? err.message : "Failed to start camera.";
      setError(message);
      if (onScanErrorRef.current && err instanceof Error) {
        onScanErrorRef.current(err);
      }
    }
  }, [containerEl, selectedDeviceId, stopScanning, ensureVideoEl]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDevices();
    return () => stopScanning();
  }, [loadDevices, stopScanning]);

  useEffect(() => {
    if (containerEl) void startScanning();
    return () => stopScanning();
  }, [selectedDeviceId, containerEl, startScanning, stopScanning]);

  return {
    videoRef,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    error,
    isInitializing,
    isCameraLoading,
    scanStatus,
    refetchDevices: loadDevices,
    startScanning,
    stopScanning,
  };
}