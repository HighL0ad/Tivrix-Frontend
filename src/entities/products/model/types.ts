export type ProductStatus = "new" | "in_stock" | "sold" | "reserved" | "returned";

export type ProductSaleSummary = {
  id: number;
  total_price: string;
  cash_price: string | null;
  sale_mode: "full_payment" | "partial_debt" | "full_debt" | "installment";
  profit: string;
  sold_at: string | null;
  source: string | null;
};

export type ProductSaleDetail = ProductSaleSummary & {
  client_name: string | null;
  client_phone: string | null;
  shop_debt_due_date: string | null;
  proof_image: string | null;
};

export type ProductImage = {
  id: number;
  image_path: string;
};

export type ProductListItem = {
  id: number;
  name: string;
  imei: string;
  imei2: string | null;
  phone_number: string | null;
  buy_price: string;
  status: ProductStatus;
  supplier_name: string | null;
  registration_statuses: string[];
  created_at: string | null;
  primary_image_path: string | null;
  current_sale: ProductSaleSummary | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ProductDetail = Omit<
  ProductListItem,
  "primary_image_path" | "current_sale"
> & {
  images: ProductImage[];
  current_sale: ProductSaleDetail | null;
};

export type ProductOption = {
  id: string;
  name: string;
};

export type ProductWalletOption = ProductOption & {
  type: string | null;
};

export type ProductCreateOptions = {
  supplier_wallet_options: ProductOption[];
  purchase_source_options: ProductWalletOption[];
  payment_wallet_options: ProductOption[];
  split_wallet_options: ProductWalletOption[];
  cash_wallet_id: string | null;
};

export type ProductImeiCheck = {
  exists: boolean;
  product_id: number | null;
  product_name: string | null;
};

export type ProductSellOptions = {
  product: ProductDetail;
  sale_wallet_options: ProductOption[];
  sale_client_options: ProductOption[];
  sale_client_debt_options: ProductOption[];
  sale_shop_partner_options: ProductOption[];
  sale_source_options: ProductOption[];
  registration_fee_available: boolean;
};

export type ProductSellPayload = {
  sale_type: "client" | "shop";
  sale_mode: "full_payment" | "partial_debt" | "full_debt" | "installment";
  total_price: string;
  cash_price?: string;
  payment_wallet_id?: number;
  split_payment_enabled?: boolean;
  split_payment_amount?: string;
  split_payment_wallet_id?: number;
  paid_now_amount?: string;
  client_debt_wallet_id?: number;
  client_id?: number;
  installment_months?: number;
  installment_payment_day?: number;
  registration_fee_enabled?: boolean;
  registration_fee_amount?: string;
  shop_wallet_id?: number;
  shop_prepayment_enabled?: boolean;
  shop_prepayment_amount?: string;
  shop_prepayment_wallet_id?: number;
  shop_split_payment_enabled?: boolean;
  shop_split_payment_amount?: string;
  shop_split_payment_wallet_id?: number;
  shop_debt_due_date?: string;
  client_name?: string;
  client_phone?: string;
  source?: string;
};
