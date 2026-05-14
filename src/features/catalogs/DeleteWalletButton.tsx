import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useDeleteWallet } from "@/entities/catalogs/api/use-catalogs";
import { getApiErrorMessage } from "@/shared/api/error";
import { cn } from "@/shared/lib/utils";
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

export function DeleteWalletButton({
  walletId,
  walletName,
}: {
  walletId: number;
  walletName: string;
}) {
  const { t } = useTranslation();
  const deleteWallet = useDeleteWallet();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn("text-muted-foreground hover:bg-red-50 hover:text-red-600")}
          aria-label={t("common.delete")}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("catalogs.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("catalogs.deleteDescription", { name: walletName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteWallet.isPending}
            onClick={() =>
              deleteWallet.mutate(walletId, {
                onSuccess: () => toast.success(t("catalogs.deleted")),
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
