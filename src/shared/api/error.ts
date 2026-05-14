import { ApiError } from "@/shared/api/http";
import { i18n } from "@/shared/i18n";

export function getApiErrorMessage(error: unknown, fallback = i18n.t("common.operationFailed")) {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      return payload.detail;
    }
  }

  return fallback;
}
