import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { CurrentUser } from "@/entities/auth/model/types";

type LoginPayload = {
  username: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<CurrentUser>("/api/auth/login", {
    method: "POST",
    json: payload,
    redirectOnUnauthorized: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: login,
  });
}

export function setPassword(payload: { token: string; password: string }) {
  return apiRequest<{ ok: boolean }>("/api/auth/set-password", {
    method: "POST",
    json: payload,
    redirectOnUnauthorized: false,
  });
}

export function useSetPassword() {
  return useMutation({
    mutationFn: setPassword,
  });
}
