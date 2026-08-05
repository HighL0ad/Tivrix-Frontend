import { ApiError } from "@/shared/api/http";
import { i18n } from "@/shared/i18n";

export function getApiErrorMessage(
  error: unknown,
  fallback = i18n.t("common.operationFailed"),
): string {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      const detail = payload.detail.trim().toLowerCase();
      if (
        detail.includes("incorrect username or password") ||
        detail.includes("invalid credentials") ||
        detail.includes("incorrect password") ||
        detail.includes("user not found") ||
        detail.includes("invalid username or password")
      ) {
        return i18n.t("errors.invalidCredentials");
      }
      if (
        detail.includes("user is disabled") ||
        detail.includes("user is inactive") ||
        detail.includes("inactive user")
      ) {
        return i18n.t("errors.userDisabled");
      }
      if (
        detail.includes("invalid or expired token") ||
        detail.includes("invalid token") ||
        detail.includes("token expired") ||
        detail.includes("expired token")
      ) {
        return i18n.t("errors.invalidToken");
      }
      if (
        detail.includes("permission") ||
        detail.includes("forbidden") ||
        detail.includes("not allowed")
      ) {
        return i18n.t("errors.permissionDenied");
      }
      if (detail.includes("internal server error")) {
        return i18n.t("errors.serverError");
      }
      return payload.detail;
    }

    if (error.status === 401) {
      return i18n.t("errors.invalidCredentials");
    }
    if (error.status === 403) {
      return i18n.t("errors.permissionDenied");
    }
    if (error.status >= 500) {
      return i18n.t("errors.serverError");
    }
  }

  return fallback;
}
