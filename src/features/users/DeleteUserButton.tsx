import { Trash2 } from "lucide-react";

import { useDeleteUser } from "@/entities/users/api/use-users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

export function DeleteUserButton({
  userId,
  username,
  disabled,
}: {
  userId: number;
  username: string;
  disabled?: boolean;
}) {
  const deleteUser = useDeleteUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={disabled}
          aria-label="Удалить"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
          <AlertDialogDescription>
            Аккаунт {username} будет удалён из системы.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteUser.isPending}
            onClick={() => deleteUser.mutate(userId)}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
