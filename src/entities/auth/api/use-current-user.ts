import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { CurrentUser } from "@/entities/auth/model/types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<CurrentUser>("/api/auth/me"),
    retry: false,
  });
}
