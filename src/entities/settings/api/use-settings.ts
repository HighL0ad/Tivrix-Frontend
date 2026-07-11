import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";

export type SystemSettings = {
  credit_system_enabled: boolean;
  credit_system_allowed?: boolean;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiRequest<SystemSettings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemSettings) =>
      apiRequest<SystemSettings>("/api/settings", {
        method: "PATCH",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
