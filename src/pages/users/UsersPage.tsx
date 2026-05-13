import { Crown, ShieldCheck, UserRound } from "lucide-react";

import { useUsers } from "@/entities/users/api/use-users";
import { DeleteUserButton } from "@/features/users/DeleteUserButton";
import { UserDialog } from "@/features/users/UserDialog";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const roleLabel: Record<string, string> = {
  super_admin: "Супер админ",
  admin: "Админ",
  user: "Пользователь",
};

const roleBadgeClassName: Record<string, string> = {
  super_admin: "border-amber-200 bg-amber-50 text-amber-800",
  admin: "border-sky-200 bg-sky-50 text-sky-800",
  user: "border-border bg-background text-muted-foreground",
};

const RoleIcon = {
  super_admin: Crown,
  admin: ShieldCheck,
  user: UserRound,
};

export function UsersPage() {
  const usersQuery = useUsers();

  if (usersQuery.isLoading) {
    return <PageLoading />;
  }

  if (!usersQuery.data) {
    return <PageError />;
  }

  return (
    <section className="space-y-5">
      <PageHeader title="Пользователи" description="Роли и доступы." />

      <Card>
        <CardHeader className="grid grid-cols-[1fr_auto] items-center">
          <CardTitle>Список</CardTitle>
          <UserDialog mode="create" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Доступы</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.data.items.map((user) => {
                const Icon = RoleIcon[user.role] ?? UserRound;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleBadgeClassName[user.role]}
                      >
                        <Icon />
                        {roleLabel[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "outline"}>
                        {user.is_active ? "Активен" : "Отключен"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === "super_admin" ? "Все + управление админами" : user.is_admin ? "Все" : [
                        user.can_access_dashboard && "Главная",
                        user.can_access_products && "Товары",
                        user.can_access_finance && "Касса",
                        user.can_access_debts && "Долги",
                        user.can_access_catalogs && "Справочники",
                      ].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <UserDialog mode="edit" user={user} />
                        <DeleteUserButton
                          userId={user.id}
                          username={user.username}
                          disabled={user.id === usersQuery.data.current_user_id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
