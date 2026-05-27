import type { ProductSellPayload } from "@/entities/products/model/types";
import { i18n } from "@/shared/i18n";

export function toNumber(value: string | number | null | undefined) {
  if (value === undefined || value === null) return 0;
  const clean = typeof value === "string" ? value.replace(/\s/g, "") : String(value);
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toOptionalNumber(value: string | number | null | undefined) {
  if (!value) {
    return undefined;
  }
  const clean = typeof value === "string" ? value.replace(/\s/g, "") : String(value);
  const parsed = Number(clean);
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

  return i18n.t("sell.error");
}
