const productsReturnLocationKey = "tivrix:last-products-location";

export function saveProductsReturnLocation(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(productsReturnLocationKey, path);
}

export function getProductsReturnLocation() {
  if (typeof window === "undefined") return "/products";
  return window.sessionStorage.getItem(productsReturnLocationKey) ?? "/products";
}

export function resolveProductsReturnLocation(candidate?: string) {
  const saved = getProductsReturnLocation();
  if (!candidate) return saved;
  if (candidate === "/products" && saved !== "/products") return saved;
  return candidate;
}
