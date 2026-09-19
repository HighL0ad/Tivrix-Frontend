import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { ProductDetail } from "@/entities/products/model/types";

export function useUpdateProduct(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest<ProductDetail>(`/api/products/${productId}`, {
        method: "PUT",
        body: formData,
      }),
    onSuccess: (product) => {
      queryClient.setQueryData(["products", product.id], product);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
