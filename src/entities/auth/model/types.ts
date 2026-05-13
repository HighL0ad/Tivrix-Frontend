export type AppResourceKey =
  | "dashboard"
  | "products"
  | "finance"
  | "debts"
  | "catalogs";

export type UserRole = "super_admin" | "admin" | "user";

export type ResourcePermission = {
  key: AppResourceKey;
  label: string;
  description: string;
  can_access: boolean;
};

export type OperationPermissionKey =
  | "can_view_finance_history"
  | "can_view_finance_profit"
  | "can_view_finance_expenses"
  | "can_transfer_wallets"
  | "can_adjust_wallets"
  | "can_undo_transactions";

export type OperationPermission = {
  key: OperationPermissionKey;
  label: string;
  description: string;
  can_access: boolean;
};

export type CurrentUser = {
  id: number;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  is_admin: boolean;
  restriction_comment: string | null;
  first_accessible_route: string | null;
  permissions: Record<AppResourceKey, boolean>;
  operation_permissions: Record<OperationPermissionKey, boolean>;
  resources: ResourcePermission[];
  operations: OperationPermission[];
};
