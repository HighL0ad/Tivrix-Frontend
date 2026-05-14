import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useDeleteUser } from "@/entities/users/api/use-users";
import { getApiErrorMessage } from "@/shared/api/error";
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
  const { t } = useTranslation();
  const deleteUser = useDeleteUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={disabled}
          aria-label={t("common.delete")}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("users.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("users.deleteDescription", { username })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteUser.isPending}
            onClick={() =>
              deleteUser.mutate(userId, {
                onSuccess: () => toast.success(t("users.deleted")),
                onError: (error) => toast.error(getApiErrorMessage(error)),
              })
            }
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
