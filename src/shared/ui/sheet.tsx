import type { ComponentProps } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";

function Sheet(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

const SheetTrigger = DialogTrigger;
const SheetHeader = DialogHeader;
const SheetTitle = DialogTitle;
const SheetDescription = DialogDescription;

function SheetContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "top-auto bottom-0 left-0 max-h-[92vh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-lg rounded-b-none",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
