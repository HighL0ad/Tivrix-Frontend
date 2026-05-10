import { useUsers } from "@/entities/users/api/use-users";
import { DeleteUserButton } from "@/features/users/DeleteUserButton";
import { UserDialog } from "@/features/users/UserDialog";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

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
              {usersQuery.data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "secondary" : "outline"}>
                      {user.is_active ? "Активен" : "Отключен"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_admin ? "Все" : [
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
