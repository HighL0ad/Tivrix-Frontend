import { type PSM } from "tesseract.js";

import { formatImeiInput } from "@/shared/lib/input-formatters";

export interface ProductPhotoMetadata {
  imeis: string[];
  name: string;
}

const PHONE_LINE_KEYWORDS =
  /\b(iPhone|Samsung|Galaxy|Xiaomi|Redmi|POCO|Huawei|Honor|Realme|Oppo|Vivo|OnePlus|Pixel|Motorola|Nokia|Nothing)\b/i;
const APPLE_MODEL_PATTERN =
  /\biPhone\s+(?:\d{1,2}|SE|Air)(?:\s+(?:Pro\s+Max|Pro|Plus|Max|mini))?(?:\s*,\s*[^,\n]{2,36})?(?:\s*,\s*\d+\s*(?:GB|TB))?/i;
const ACCESSORY_TEXT_PATTERN =
  /\b(USB|USB-C|Lightning|cable|charger|adapter|charge|charging|kabel|sarj|şarj|daxildir|includes)\b/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function validateLuhn(imei: string): boolean {
  const cleaned = imei.replace(/\D/g, "");
  if (cleaned.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    let digit = Number(cleaned.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function extractValidImeisFromSegment(text: string): string[] {
  const normalised = text.replace(/[^\dA-Za-z/.,:\-\s]/g, " ");
  const onlyDigits = normalised.replace(/\D/g, "");
  const candidates = new Set<string>();

  (normalised.match(/\b\d[\d\s-]{13,24}\d\b/g) ?? []).forEach((value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 15) candidates.add(digits);
  });

  for (let i = 0; i <= onlyDigits.length - 15; i += 1) {
    candidates.add(onlyDigits.slice(i, i + 15));
  }

  return Array.from(candidates).filter(validateLuhn);
}

function extractLabeledImeis(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const imeis: string[] = [];
  const labelPattern = /I\s*[\W_]*M\s*[\W_]*E\s*[\W_]*I(?:\s*[\W_]*(?:2|M\s*[\W_]*E\s*[\W_]*I\s*[\W_]*D))?|M\s*[\W_]*E\s*[\W_]*I\s*[\W_]*D/gi;

  lines.forEach((line, index) => {
    labelPattern.lastIndex = 0;
    if (!labelPattern.test(line)) return;

    const segment = [
      lines[index - 1] ?? "",
      line,
      lines[index + 1] ?? "",
      lines[index + 2] ?? "",
      lines[index + 3] ?? "",
    ].join(" ");
    for (const imei of extractValidImeisFromSegment(segment)) {
      if (!imeis.includes(imei)) imeis.push(imei);
    }
  });

  labelPattern.lastIndex = 0;
  for (const match of text.matchAll(labelPattern)) {
    const start = Math.max((match.index ?? 0) - 40, 0);
    const end = Math.min((match.index ?? 0) + 260, text.length);
    const segment = text.slice(start, end);
    for (const imei of extractValidImeisFromSegment(segment)) {
      if (!imeis.includes(imei)) imeis.push(imei);
    }
  }

  return imeis;
}

function cleanProductName(value: string) {
  return value
    .replace(/\b(MQ|M|A)\d{3,5}[A-Z]{0,2}\/A\b/gi, "")
    .replace(/\b(Model|Serial|IMEI|MEID|UPC)\b.*$/i, "")
    .replace(/\bOther items\b.*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/^[^\w]+|[^\w),]+$/g, "")
    .trim();
}

function extractProductName(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanProductName(line))
    .filter((line) => line.length >= 6);

  for (const line of lines) {
    if (ACCESSORY_TEXT_PATTERN.test(line)) continue;
    const model = line.match(APPLE_MODEL_PATTERN)?.[0];
    if (model) return cleanProductName(model);
  }

  for (const line of lines) {
    if (ACCESSORY_TEXT_PATTERN.test(line)) continue;
    const match = line.match(PHONE_LINE_KEYWORDS);
    if (!match || match.index === undefined) continue;
    const candidate = cleanProductName(line.slice(match.index));
    if (candidate.length >= 6) return candidate;
  }

  return "";
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
      reject(new Error("Failed to load product photo."));
    };
    image.src = url;
  });
}

function getOcrCrops(image: HTMLImageElement) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const crops = [
    { x: 0, y: 0, width, height },
    { x: 0, y: height * 0.48, width, height: height * 0.48 },
    { x: width * 0.05, y: height * 0.66, width: width * 0.55, height: height * 0.24 },
    { x: width * 0.08, y: height * 0.72, width: width * 0.48, height: height * 0.16 },
    { x: width * 0.38, y: height * 0.35, width: width * 0.58, height: height * 0.58 },
    { x: width * 0.48, y: height * 0.5, width: width * 0.42, height: height * 0.42 },
  ];

  return crops.map((crop) => ({
    x: Math.floor(clamp(crop.x, 0, width - 1)),
    y: Math.floor(clamp(crop.y, 0, height - 1)),
    width: Math.floor(clamp(crop.width, 1, width - crop.x)),
    height: Math.floor(clamp(crop.height, 1, height - crop.y)),
  }));
}

function drawOcrCropToCanvas(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  rotation: 0 | 90 | 180 | 270 = 0,
) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(4, Math.max(2, 1600 / Math.max(crop.width, crop.height)));
  const rotated = rotation === 90 || rotation === 270;
  canvas.width = Math.round((rotated ? crop.height : crop.width) * scale);
  canvas.height = Math.round((rotated ? crop.width : crop.height) * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to prepare product photo.");

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

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const contrasted = clamp((value - 128) * 1.9 + 128, 0, 255);
    data[i] = contrasted;
    data[i + 1] = contrasted;
    data[i + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

export function applyPhotoMetadataToProductFields(
  metadata: ProductPhotoMetadata,
  current: { name: string; imei: string; imei2: string },
) {
  return {
    name: current.name.trim() ? current.name : metadata.name,
    imei: current.imei.trim()
      ? current.imei
      : formatImeiInput(metadata.imeis[0] ?? ""),
    imei2: current.imei2.trim()
      ? current.imei2
      : formatImeiInput(metadata.imeis[1] ?? ""),
  };
}

export async function extractProductMetadataFromPhoto(
  file: File,
): Promise<ProductPhotoMetadata> {
  const image = await loadImageFile(file);
  const { createWorker, PSM: PageSegMode } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    gzip: true,
    langPath: "/tessdata",
    logger: () => {},
  });
  const texts: string[] = [];

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: PageSegMode.SPARSE_TEXT as PSM,
      user_defined_dpi: "300",
    });

    for (const crop of getOcrCrops(image)) {
      const canvas = drawOcrCropToCanvas(image, crop);
      const { data } = await worker.recognize(canvas);
      texts.push(data.text);
    }

    if (extractLabeledImeis(texts.join("\n")).length === 0) {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const fullImageCrop = { x: 0, y: 0, width, height };

      for (const rotation of [90, 270, 180] as const) {
        const canvas = drawOcrCropToCanvas(image, fullImageCrop, rotation);
        const { data } = await worker.recognize(canvas);
        texts.push(data.text);

        if (extractLabeledImeis(texts.join("\n")).length > 0) break;
      }
    }
  } finally {
    await worker.terminate();
  }

  const text = texts.join("\n");
  return {
    imeis: extractLabeledImeis(text),
    name: extractProductName(text),
  };
}
