import { apiRequest } from "@/shared/api/http";

export function logout() {
  return apiRequest<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
