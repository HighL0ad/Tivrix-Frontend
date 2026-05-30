import { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type QrcodeErrorCallback,
  type QrcodeSuccessCallback,
} from "html5-qrcode";

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

type ZoomCapability = {
  min?: number;
  max?: number;
  step?: number;
};

type TunableMediaTrackCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: ZoomCapability;
};

type TunableMediaTrackSettings = MediaTrackSettings & {
  zoom?: number;
};

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

export function extractValidImeis(text: string): string[] {
  return extractImeiCandidates(text).filter(validateLuhn);
}

export function extractImeiCandidates(text: string): string[] {
  const onlyDigits = text.replace(/\D/g, "");
  const candidates = new Set<string>();

  const strictMatches = text.match(/\b\d{15}\b/g) || [];
  strictMatches.forEach((value) => candidates.add(value));

  const looseMatches = text.match(/\d{15}/g) || [];
  looseMatches.forEach((value) => candidates.add(value));

  for (let i = 0; i <= onlyDigits.length - 15; i++) {
    candidates.add(onlyDigits.slice(i, i + 15));
  }

  return Array.from(candidates);
}

function getBackCameraDevices(devices: ScannerDevice[]) {
  return devices.filter((device) => {
    const label = device.label.toLowerCase();
    return !(
      label.includes("front") ||
      label.includes("selfie") ||
      label.includes("передняя") ||
      label.includes("фронтальная")
    );
  });
}

function getCameraScore(device: ScannerDevice) {
  const label = device.label.toLowerCase();
  let score = 0;

  if (label.includes("back") || label.includes("rear")) score += 50;
  if (label.includes("environment") || label.includes("основная")) score += 50;
  if (label.includes("wide") && !label.includes("ultra")) score += 12;
  if (label.includes("dual") || label.includes("triple")) score += 8;
  if (label.includes("ultra")) score -= 20;
  if (label.includes("telephoto")) score -= 12;
  if (label.includes("front") || label.includes("selfie")) score -= 100;

  return score;
}

function sortCameras(devices: ScannerDevice[]) {
  return [...devices].sort((left, right) => {
    const scoreDiff = getCameraScore(right) - getCameraScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return left.label.localeCompare(right.label);
  });
}

function pickBestCamera(devices: ScannerDevice[]) {
  const backDevices = getBackCameraDevices(devices);
  const candidates = sortCameras(backDevices.length > 0 ? backDevices : devices);
  return candidates[0];
}

async function tuneCameraForBarcode(scanner: Html5Qrcode) {
  try {
    const capabilities =
      scanner.getRunningTrackCapabilities() as TunableMediaTrackCapabilities;
    const settings =
      scanner.getRunningTrackSettings() as TunableMediaTrackSettings;
    const advanced: MediaTrackConstraintSet[] = [];

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({
        focusMode: "continuous",
      } as unknown as MediaTrackConstraintSet);
    }

    if (capabilities.zoom?.max && capabilities.zoom.max > 1) {
      const currentZoom = settings.zoom ?? capabilities.zoom.min ?? 1;
      const targetZoom = Math.min(
        capabilities.zoom.max,
        Math.max(currentZoom, 2),
      );

      advanced.push({
        zoom: targetZoom,
      } as unknown as MediaTrackConstraintSet);
    }

    if (advanced.length > 0) {
      await scanner.applyVideoConstraints({ advanced });
    }
  } catch (err) {
    console.warn("[IMEI SCANNER] Failed to tune camera", err);
  }
}

export function useImeiScanner({
  onScanSuccess,
  onScanError,
}: UseImeiScannerProps) {
  const scannerIdRef = useRef(
    `imei-scanner-${Math.random().toString(36).slice(2)}`,
  );
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement | null>(null);
  const lastScannedRef = useRef<string>("");
  const pendingScanRef = useRef<{ key: string; count: number }>({
    key: "",
    count: 0,
  });

  const [scannerElement, setScannerElement] = useState<HTMLDivElement | null>(
    null,
  );
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

  const videoRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      element.id = scannerIdRef.current;
    }
    scannerElementRef.current = element;
    setScannerElement(element);
  }, []);

  const loadDevices = useCallback(async () => {
    setIsInitializing(true);
    setError("");

    try {
      const cameras = await Html5Qrcode.getCameras();
      const allDevices = cameras.map((camera) => ({
        deviceId: camera.id,
        label: camera.label,
      }));
      const visibleDevices = sortCameras(getBackCameraDevices(allDevices));
      const bestCamera = pickBestCamera(allDevices);

      setDevices(visibleDevices.length > 0 ? visibleDevices : sortCameras(allDevices));
      setSelectedDeviceId(bestCamera?.deviceId || "");
    } catch (err) {
      console.warn("[IMEI SCANNER] Failed to list video devices", err);
      setSelectedDeviceId("");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      await scanner.stop();
    }
    scanner?.clear();
    scannerRef.current = null;
    setIsCameraLoading(false);
    setScanStatus("idle");
  }, []);

  const startScanning = useCallback(async () => {
    if (!scannerElement) return;

    await stopScanning();

    lastScannedRef.current = "";
    pendingScanRef.current = { key: "", count: 0 };
    setIsCameraLoading(true);
    setScanStatus("starting");
    setError("");

    const scanner = new Html5Qrcode(scannerIdRef.current, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
      ],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    scannerRef.current = scanner;

    const handleSuccess: QrcodeSuccessCallback = (decodedText) => {
      const validImeis = extractValidImeis(decodedText);
      const imeiCandidates = extractImeiCandidates(decodedText);
      const acceptedImeis =
        validImeis.length > 0
          ? validImeis
          : imeiCandidates.filter((candidate) => candidate.length === 15);

      setScanStatus(acceptedImeis.length > 0 ? "imei-found" : "code-found");

      if (acceptedImeis.length === 0) return;

      const key = acceptedImeis.join(",");
      if (lastScannedRef.current === key) return;

      if (pendingScanRef.current.key === key) {
        pendingScanRef.current.count += 1;
      } else {
        pendingScanRef.current = { key, count: 1 };
      }

      if (pendingScanRef.current.count < 2) return;

      lastScannedRef.current = key;
      onScanSuccessRef.current(acceptedImeis);
    };

    const handleError: QrcodeErrorCallback = () => {};

    const camera = selectedDeviceId || { facingMode: "environment" };

    try {
      await scanner.start(
        camera,
        {
          fps: 10,
          aspectRatio: 1.7777778,
          disableFlip: true,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.min(viewfinderWidth * 0.92, 540),
            height: Math.min(viewfinderHeight * 0.34, 150),
          }),
          videoConstraints: selectedDeviceId
            ? {
                deviceId: selectedDeviceId,
              }
            : {
                facingMode: "environment",
              },
        },
        handleSuccess,
        handleError,
      );
      await tuneCameraForBarcode(scanner);
      setIsCameraLoading(false);
      setScanStatus("scanning");
    } catch (err) {
      setIsCameraLoading(false);
      setScanStatus("idle");

      const message =
        err instanceof Error ? err.message : "Failed to start camera decoding.";

      setError(message);

      if (onScanErrorRef.current && err instanceof Error) {
        onScanErrorRef.current(err);
      }
    }
  }, [scannerElement, selectedDeviceId, stopScanning]);

  useEffect(() => {
    loadDevices();

    return () => {
      void stopScanning();
    };
  }, [loadDevices, stopScanning]);

  useEffect(() => {
    if (scannerElement) {
      void startScanning();
    }

    return () => {
      void stopScanning();
    };
  }, [selectedDeviceId, scannerElement, startScanning, stopScanning]);

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
