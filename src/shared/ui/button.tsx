import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button-variants"

function Button({
  asChild = false,
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : ButtonPrimitive

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
