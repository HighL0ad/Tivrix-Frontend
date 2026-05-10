import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type {
  ProductCreateOptions,
  ProductDetail,
  ProductImeiCheck,
} from "@/entities/products/model/types";

export function useProductCreateOptions() {
  return useQuery({
    queryKey: ["products", "create-options"],
    queryFn: () => apiRequest<ProductCreateOptions>("/api/products/create-options"),
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest<ProductDetail>("/api/products", {
        method: "POST",
        body: formData,
      }),
  });
}

export function checkProductImei(imei: string) {
  const searchParams = new URLSearchParams({ imei });
  return apiRequest<ProductImeiCheck>(
    `/api/products/check-imei?${searchParams.toString()}`,
  );
}
