import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent font-bold shadow-sm transition-all outline-none select-none active:not-aria-[haspopup]:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-sky-700",
        outline:
          "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-none hover:bg-teal-100 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-muted-foreground shadow-none hover:bg-secondary hover:text-primary aria-expanded:bg-secondary aria-expanded:text-primary",
        destructive:
          "bg-red-50 text-red-600 shadow-none hover:bg-red-100 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        xs: "h-7 px-2 text-xs",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
