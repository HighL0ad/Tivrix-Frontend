import { ApiError } from "@/shared/api/http";

export function getApiErrorMessage(error: unknown, fallback = "Операция не выполнена") {
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
