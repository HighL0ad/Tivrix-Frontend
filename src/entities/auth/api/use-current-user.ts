import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { CurrentUser } from "@/entities/auth/model/types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<CurrentUser>("/api/auth/me"),
    retry: false,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return apiRequest<CurrentUser>("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (currentUser) => {
      queryClient.setQueryData(["auth", "me"], currentUser);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
