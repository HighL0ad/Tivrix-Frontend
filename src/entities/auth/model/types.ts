export type AppResourceKey =
  | "dashboard"
  | "products"
  | "finance"
  | "debts"
  | "catalogs";

export type UserRole = "admin" | "user";

export type ResourcePermission = {
  key: AppResourceKey;
  label: string;
  description: string;
  can_access: boolean;
};

export type CurrentUser = {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  is_admin: boolean;
  restriction_comment: string | null;
  first_accessible_route: string | null;
  permissions: Record<AppResourceKey, boolean>;
  resources: ResourcePermission[];
};
