import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";

export type Transaction = {
  id: number;
  amount: string;
  description: string;
  display_description: string;
  route_label: string;
  operation_kind: string;
  created_by_username: string | null;
  created_at: string | null;
  product_id: number | null;
  product_name: string | null;
  from_wallet_name: string | null;
  to_wallet_name: string | null;
  can_undo: boolean;
  can_undo_sale: boolean;
  hide_undo_action: boolean;
  undo_disabled_reason: string | null;
};

export type DashboardPeriod = {
  revenue: string;
  profit: string;
  buy_total: string;
  count: number;
  margin_percent: string;
};

export type RegistrationAlert = {
  product_id: number;
  product_name: string;
  imei: string;
  status: "in_stock" | "sold";
  days_passed: number;
  days_remaining: number;
  deadline_date: string;
};

export type DashboardData = {
  total_money: string;
  stock_value: string;
  stock_count: number;
  we_owe: string;
  they_owe: string;
  profit_today: string;
  projected_balance: string;
  projected_balance_with_stock: string;
  total_profit: string;
  chart_labels: string[];
  chart_data: number[];
  recent_transactions: Transaction[];
  profit_overview: {
    profit_labels: string[];
    profit_dates: string[];
    profit_data: number[];
    profit_7d: string;
    revenue_7d: string;
    sales_count_7d: number;
    client_debt_7d: string;
    partner_debt_7d: string;
    debt_sales_7d: string;
    periods: Record<
      "7d" | "30d" | "90d",
      {
        profit_labels: string[];
        profit_dates: string[];
        profit_data: number[];
        profit_total: string;
        revenue_total: string;
        sales_count: number;
        client_debt_total: string;
        partner_debt_total: string;
        debt_sales_total: string;
      }
    >;
  };
  sales_today: DashboardPeriod;
  sales_week: DashboardPeriod;
  sales_month: DashboardPeriod;
  sales_all_time: DashboardPeriod;
  stock_overview: {
    in_stock_count: number;
    sold_count: number;
    reserved_count: number;
    buy_total: string;
    potential_sale_total: string;
  };
  debt_overview: {
    clients_owe: string;
    we_owe: string;
    balance: string;
    active_count: number;
  };
  registration_alerts: RegistrationAlert[];
  my_wallets: Array<{ id: number; name: string; type: string; balance: string }>;
};


export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest<DashboardData>("/api/dashboard"),
  });
}
