import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserCodeReader, BrowserMultiFormatReader } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
  type Result,
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

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(platform) ||
    (platform === "macintel" && navigator.maxTouchPoints > 1)
  );
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

/**
 * Normalise a raw ZXing decode result before candidate extraction.
 *
 * Apple / carrier boxes use GS1-128, which ZXing returns with:
 *   - a "]C1" symbology identifier prefix
 *   - ASCII GS (0x1D) as the group-separator between AIs
 *   - Application Identifiers like (01), (21), (17) wrapping the payload
 *
 * Example raw string for IMEI/MEID barcode:
 *   "]C1\x1D011035937235889055621..."
 *   or after stripping "]C1": "011035937235889055621..."
 *   AI 01 = GTIN-14, AI 21 = Serial — the 15-digit IMEI sits inside the
 *   GTIN-14 value (positions 1–15 of the 14-digit payload when leading
 *   digit is 0, or extracted by stripping the check digit).
 *
 * We strip all of that and fall back to the sliding-window digit scan,
 * which finds any 15-digit sequence that passes Luhn — exactly the IMEI.
 */
function normaliseBarcode(raw: string): string {
  return (
    raw
      .replace(/^\][A-Za-z]\d/, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .replace(/\(\d{2,4}\)/g, " ")
  );
}

export function extractImeiCandidates(text: string): string[] {
  const normalised = normaliseBarcode(text);
  const onlyDigits = normalised.replace(/\D/g, "");
  const candidates = new Set<string>();

  (normalised.match(/\b\d{15}\b/g) ?? []).forEach((v) => candidates.add(v));
  (normalised.match(/\d{15}/g) ?? []).forEach((v) => candidates.add(v));
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
  const isIos = isIosDevice();
  let score = 0;
  if (l.includes("back") || l.includes("rear")) score += 50;
  if (l.includes("environment") || l.includes("основная")) score += 50;
  if (l.includes("wide") && !l.includes("ultra")) score += isIos ? 4 : 12;
  if (l.includes("dual") || l.includes("triple")) score += isIos ? -8 : 8;
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

function createReader() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.ASSUME_GS1, true);
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 100,
    delayBetweenScanSuccess: 500,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    image.src = url;
  });
}

function drawImageCropToCanvas(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  rotation: 0 | 90 | 180 | 270,
  contrast = false,
) {
  const canvas = document.createElement("canvas");
  const rotated = rotation === 90 || rotation === 270;
  const scale = Math.min(2, Math.max(1, 1200 / Math.max(crop.width, crop.height)));
  canvas.width = Math.round((rotated ? crop.height : crop.width) * scale);
  canvas.height = Math.round((rotated ? crop.width : crop.height) * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to prepare image.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -crop.width / 2,
    -crop.height / 2,
    crop.width,
    crop.height,
  );

  if (contrast) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const boosted = value < 150 ? 0 : 255;
      data[i] = boosted;
      data[i + 1] = boosted;
      data[i + 2] = boosted;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function createImageScanCrops(image: HTMLImageElement) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const crops = [
    { x: 0, y: 0, width, height },
    { x: width * 0.45, y: 0, width: width * 0.55, height },
    { x: width * 0.55, y: height * 0.45, width: width * 0.35, height: height * 0.5 },
    { x: width * 0.58, y: height * 0.55, width: width * 0.28, height: height * 0.4 },
    { x: width * 0.62, y: height * 0.6, width: width * 0.25, height: height * 0.35 },
    { x: width * 0.68, y: height * 0.5, width: width * 0.18, height: height * 0.45 },
    { x: width * 0.7, y: height * 0.58, width: width * 0.16, height: height * 0.35 },
    {
      x: width * 0.35,
      y: height * 0.2,
      width: width * 0.65,
      height: height * 0.8,
    },
    {
      x: width * 0.5,
      y: height * 0.2,
      width: width * 0.5,
      height: height * 0.8,
    },
    {
      x: width * 0.4,
      y: height * 0.45,
      width: width * 0.6,
      height: height * 0.55,
    },
    { x: width * 0.55, y: 0, width: width * 0.35, height },
  ];

  return crops.map((crop) => ({
    x: Math.floor(clamp(crop.x, 0, width - 1)),
    y: Math.floor(clamp(crop.y, 0, height - 1)),
    width: Math.floor(clamp(crop.width, 1, width - crop.x)),
    height: Math.floor(clamp(crop.height, 1, height - crop.y)),
  }));
}

function getResultText(result: Result | undefined) {
  return result?.getText() ?? "";
}

type NativeBarcodeDetector = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

async function detectNativeBarcodeTexts(source: CanvasImageSource) {
  const detectorClass = (globalThis as unknown as {
    BarcodeDetector?: NativeBarcodeDetector;
  }).BarcodeDetector;
  if (!detectorClass) return [];

  try {
    const detector = new detectorClass({
      formats: ["code_128", "code_39", "code_93", "itf"],
    });
    const barcodes = await detector.detect(source);
    return barcodes.map((barcode) => barcode.rawValue ?? "").filter(Boolean);
  } catch (err) {
    console.warn("[IMEI SCANNER] native barcode detector failed", err);
    return [];
  }
}

async function decodeCanvasTexts(
  reader: BrowserMultiFormatReader,
  canvas: HTMLCanvasElement,
) {
  const texts = new Set<string>();

  for (const decoded of await detectNativeBarcodeTexts(canvas)) {
    texts.add(decoded);
  }

  try {
    const decoded = getResultText(reader.decodeFromCanvas(canvas));
    if (decoded) texts.add(decoded);
  } catch (err) {
    if (!(err instanceof NotFoundException)) {
      console.warn("[IMEI SCANNER] image decode error", err);
    }
  }

  return Array.from(texts);
}

// ─── Smart Viewfinder Cropping for ZXing ──────────────────────────────────────

(BrowserCodeReader as unknown as {
  drawImageOnCanvas: (
    canvasElementContext: CanvasRenderingContext2D,
    srcElement: HTMLVideoElement,
  ) => void;
}).drawImageOnCanvas = function (
  canvasElementContext: CanvasRenderingContext2D,
  srcElement: HTMLVideoElement,
): void {
  const scanRegion = srcElement
    .closest("[data-imei-scanner]")
    ?.querySelector<HTMLElement>("[data-imei-scan-region]");
  const videoRect = srcElement.getBoundingClientRect();
  const regionRect = scanRegion?.getBoundingClientRect();

  if (!regionRect || videoRect.width <= 0 || videoRect.height <= 0) {
    canvasElementContext.drawImage(
      srcElement,
      0,
      0,
      canvasElementContext.canvas.width,
      canvasElementContext.canvas.height,
    );
    return;
  }

  const videoWidth = srcElement.videoWidth;
  const videoHeight = srcElement.videoHeight;

  if (!videoWidth || !videoHeight) {
    canvasElementContext.drawImage(
      srcElement,
      0,
      0,
      canvasElementContext.canvas.width,
      canvasElementContext.canvas.height,
    );
    return;
  }

  const scale = Math.max(
    videoRect.width / videoWidth,
    videoRect.height / videoHeight,
  );
  const visibleVideoWidth = videoRect.width / scale;
  const visibleVideoHeight = videoRect.height / scale;
  const visibleVideoLeft = (videoWidth - visibleVideoWidth) / 2;
  const visibleVideoTop = (videoHeight - visibleVideoHeight) / 2;

  const regionLeft = clamp(regionRect.left - videoRect.left, 0, videoRect.width);
  const regionTop = clamp(regionRect.top - videoRect.top, 0, videoRect.height);
  const regionRight = clamp(regionRect.right - videoRect.left, 0, videoRect.width);
  const regionBottom = clamp(regionRect.bottom - videoRect.top, 0, videoRect.height);

  const cropX = clamp(visibleVideoLeft + regionLeft / scale, 0, videoWidth - 1);
  const cropY = clamp(visibleVideoTop + regionTop / scale, 0, videoHeight - 1);
  const cropWidth = clamp((regionRight - regionLeft) / scale, 1, videoWidth - cropX);
  const cropHeight = clamp((regionBottom - regionTop) / scale, 1, videoHeight - cropY);

  canvasElementContext.drawImage(
    srcElement,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvasElementContext.canvas.width,
    canvasElementContext.canvas.height,
  );
};

// ─── Camera zoom/focus tuning ────────────────────────────────────────────────

type TunableCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: { min?: number; max?: number; step?: number };
  exposureMode?: string[];
};
type TunableSettings = MediaTrackSettings & { zoom?: number };

function createVideoConstraints(deviceId: string): MediaTrackConstraints {
  const base: MediaTrackConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: { ideal: 16 / 9 },
  };

  if (deviceId) {
    return { ...base, deviceId: { exact: deviceId } };
  }

  return { ...base, facingMode: { ideal: "environment" } };
}

async function tuneCameraForBarcode(videoEl: HTMLVideoElement) {
  try {
    const stream = videoEl.srcObject;
    if (!(stream instanceof MediaStream)) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities() as TunableCapabilities;
    const settings = track.getSettings() as TunableSettings;
    const advanced: MediaTrackConstraintSet[] = [];
    const isIos = isIosDevice();

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({
        focusMode: "continuous",
      } as unknown as MediaTrackConstraintSet);
    }
    if (capabilities.exposureMode?.includes("continuous")) {
      advanced.push({
        exposureMode: "continuous",
      } as unknown as MediaTrackConstraintSet);
    }
    if (capabilities.zoom?.max && capabilities.zoom.max > 1) {
      const current = settings.zoom ?? capabilities.zoom.min ?? 1;
      const preferredZoom = isIos ? 1.15 : 2;
      const target = Math.min(
        capabilities.zoom.max,
        Math.max(current, capabilities.zoom.min ?? 1, preferredZoom),
      );
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

  const controlsRef = useRef<{ stop: () => void } | null>(null);
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
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ImeiScanStatus>("idle");

  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  const videoRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setContainerEl(element);
  }, []);

  const ensureVideoEl = useCallback((): HTMLVideoElement => {
    const container = containerRef.current!;
    let video = container.querySelector<HTMLVideoElement>("video");
    if (!video) {
      video = document.createElement("video");
      video.style.cssText =
        "width:100%;height:100%;object-fit:cover;display:block;";
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      container.appendChild(video);
    }
    videoElRef.current = video;
    return video;
  }, []);

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stopScanning = useCallback(() => {
    sessionRef.current = null;

    try {
      controlsRef.current?.stop();
    } catch {
      // Scanner may already be stopped by ZXing controls.
    }
    controlsRef.current = null;

    setIsCameraLoading(false);
    setScanStatus("idle");
  }, []);

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

  const startScanning = useCallback(async () => {
    if (!containerEl) return;

    stopScanning();

    const session = Symbol("scan-session");
    sessionRef.current = session;

    lastScannedRef.current = "";
    pendingScanRef.current = { key: "", count: 0 };
    setIsCameraLoading(true);
    setScanStatus("starting");
    setError("");

    const videoEl = ensureVideoEl();

    const reader = createReader();

    const videoConstraints = createVideoConstraints(selectedDeviceId);

    try {
      const handleFrame = (result: { getText: () => string } | undefined, err: unknown) => {
        if (err && !(err instanceof NotFoundException)) {
          console.warn("[IMEI SCANNER] frame error", err);
        }
        if (!result) return;

        const decoded = result.getText();

        const accepted = extractValidImeis(decoded);

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
      };

      let controls: { stop: () => void };
      try {
        controls = await reader.decodeFromConstraints(
          { video: videoConstraints },
          videoEl,
          handleFrame,
        );
      } catch (err) {
        if (!selectedDeviceId || !(err instanceof DOMException)) throw err;
        controls = await reader.decodeFromConstraints(
          { video: createVideoConstraints("") },
          videoEl,
          handleFrame,
        );
      }

      if (sessionRef.current !== session) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      await tuneCameraForBarcode(videoEl);
      setIsCameraLoading(false);
      setScanStatus("scanning");
    } catch (err) {
      if (sessionRef.current !== session) return;
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

  const scanImageFile = useCallback(async (file: File) => {
    setIsImageScanning(true);
    setError("");
    setScanStatus("starting");

    try {
      const image = await loadImageFile(file);
      const reader = createReader();
      const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 270, 180];
      const decodedTexts = new Set<string>();
      const contrastModes = [false, true];

      for (const crop of createImageScanCrops(image)) {
        for (const rotation of rotations) {
          for (const contrast of contrastModes) {
            const canvas = drawImageCropToCanvas(image, crop, rotation, contrast);
            const decodedCandidates = await decodeCanvasTexts(reader, canvas);

            for (const decoded of decodedCandidates) {
              if (!decoded || decodedTexts.has(decoded)) continue;

              decodedTexts.add(decoded);
              const accepted = extractValidImeis(decoded);
              if (accepted.length === 0) continue;

              setScanStatus("imei-found");
              onScanSuccessRef.current(accepted);
              return;
            }
          }
        }
      }

      setScanStatus("code-found");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to scan image.";
      setScanStatus("idle");
      setError(message);
      if (onScanErrorRef.current && err instanceof Error) {
        onScanErrorRef.current(err);
      }
    } finally {
      setIsImageScanning(false);
    }
  }, []);

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
    isImageScanning,
    scanStatus,
    refetchDevices: loadDevices,
    scanImageFile,
    startScanning,
    stopScanning,
  };
}
