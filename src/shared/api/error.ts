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
        detail.includes("invalid username or password") ||
        detail.includes("неверное имя или пароль") ||
        detail.includes("неверный логин или пароль") ||
        detail.includes("неверный пароль") ||
        detail.includes("неверные данные")
      ) {
        return i18n.t("errors.invalidCredentials");
      }
      if (
        detail.includes("user is disabled") ||
        detail.includes("user is inactive") ||
        detail.includes("inactive user") ||
        detail.includes("пользователь отключен") ||
        detail.includes("учетная запись отключена")
      ) {
        return i18n.t("errors.userDisabled");
      }
      if (
        detail.includes("invalid or expired token") ||
        detail.includes("invalid token") ||
        detail.includes("token expired") ||
        detail.includes("expired token") ||
        detail.includes("ссылка недействительна") ||
        detail.includes("сессия истекла") ||
        detail.includes("сессия недействительна")
      ) {
        return i18n.t("errors.invalidToken");
      }
      if (
        detail.includes("permission") ||
        detail.includes("forbidden") ||
        detail.includes("not allowed") ||
        detail.includes("недостаточно прав") ||
        detail.includes("доступно только")
      ) {
        return i18n.t("errors.permissionDenied");
      }
      if (
        detail.includes("internal server error") ||
        detail.includes("ошибка сервера")
      ) {
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
