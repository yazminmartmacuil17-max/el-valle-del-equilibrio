import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const pixelButton = cva(
  "inline-flex select-none items-center justify-center gap-2 border-[3px] border-ink font-pixel leading-none transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        parchment: "bg-card text-card-foreground shadow-[3px_3px_0_var(--color-ink),inset_-2px_-2px_0_var(--color-parchment-shade)] hover:bg-muted",
        good: "bg-primary text-primary-foreground shadow-[3px_3px_0_var(--color-ink),inset_-2px_-3px_0_oklch(0_0_0/0.18)] hover:brightness-110",
        bad: "bg-destructive text-destructive-foreground shadow-[3px_3px_0_var(--color-ink),inset_-2px_-3px_0_oklch(0_0_0/0.2)] hover:brightness-110",
        wood: "bg-secondary text-secondary-foreground shadow-[3px_3px_0_var(--color-ink),inset_-2px_-3px_0_oklch(0_0_0/0.2)] hover:brightness-110",
        gold: "bg-accent text-accent-foreground shadow-[3px_3px_0_var(--color-ink),inset_-2px_-3px_0_oklch(0_0_0/0.15)] hover:brightness-105",
      },
      size: {
        sm: "h-8 px-2 text-sm",
        md: "h-10 px-3 text-base",
        lg: "h-14 px-6 text-xl",
        icon: "h-10 w-10 text-lg",
      },
      active: {
        true: "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-accent",
        false: "",
      },
    },
    defaultVariants: { variant: "parchment", size: "md", active: false },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof pixelButton>;

export function PixelButton({ className, variant, size, active, ...props }: Props) {
  return <button type="button" className={cn(pixelButton({ variant, size, active }), className)} {...props} />;
}
