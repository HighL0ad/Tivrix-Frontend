import type { ProductSellPayload } from "@/entities/products/model/types";

export function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toOptionalNumber(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildSellFormData(payload: ProductSellPayload, proofPhoto: File) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "boolean") {
      if (value) {
        formData.append(key, "on");
      }
      return;
    }
    formData.append(key, String(value));
  });
  formData.append("proof_photo", proofPhoto);
  return formData;
}

export function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  return "Не удалось завершить продажу.";
}
