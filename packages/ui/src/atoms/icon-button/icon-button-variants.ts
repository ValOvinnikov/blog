import { tv } from '@blog/ui/lib/styling';

export const iconButtonVariants = tv({
  base: [
    'inline-grid size-[22px] place-items-center',
    'rounded-sm border border-transparent bg-transparent p-0',
    'text-muted transition-colors duration-base ease-console',
    // `bg-surface-2` alone reads as near-invisible here (page `--primary` vs
    // `--surface-2` is ~1.04:1 light / ~1.16:1 dark) — this button has no
    // resting border/bg, so the hover boundary is the only affordance a
    // user gets and must clear WCAG 1.4.11's 3:1 non-text minimum on its
    // own (sub-threshold signals don't stack). `--border-emphasis` does:
    // verified (OKLCH → sRGB → WCAG contrast, independently computed)
    // against `--primary` directly — light 3.54:1, dark 3.94:1.
    'hover:border-border-emphasis hover:bg-surface-2 hover:text-text',
    'cursor-pointer',
    'focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
});
