import { Trash2 } from "lucide-react";
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
  const deleteWallet = useDeleteWallet();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn("text-muted-foreground hover:bg-red-50 hover:text-red-600")}
          aria-label="Удалить"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
          <AlertDialogDescription>
            {walletName} будет удалён, если не участвует в транзакциях.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteWallet.isPending}
            onClick={() =>
              deleteWallet.mutate(walletId, {
                onSuccess: () => toast.success("Запись удалена"),
                onError: (error) => toast.error(getApiErrorMessage(error)),
              })
            }
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
