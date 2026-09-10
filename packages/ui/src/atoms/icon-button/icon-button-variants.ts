import { BRAND_VARIANT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const iconButtonVariants = tv({
  base: [
    'inline-grid size-[22px] place-items-center',
    'rounded-sm border border-transparent bg-transparent p-0',
    'text-muted transition-colors duration-base ease-smooth',
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
  variants: {
    variant: {
      bordered: [
        'size-auto min-h-0 whitespace-nowrap',
        'rounded-sm border border-border-strong bg-surface px-3 py-1.5',
        'font-mono font-normal text-label text-text',
        'transition-colors duration-base ease-smooth',
        'hover:border-brand-primary hover:text-brand-primary',
      ],
      avatar: [
        'size-8 rounded-full border-0',
        'transition-shadow duration-base ease-smooth',
        // `border-emphasis`, not `border-strong`, for the hover ring —
        // `border-strong` fails WCAG 1.4.11's 3:1 non-text contrast against
        // `--primary` (1.81:1 light / 2.26:1 dark); `border-emphasis`
        // clears it (3.54:1 / 3.94:1).
        'hover:ring-2 hover:ring-border-emphasis hover:ring-offset-2 hover:ring-offset-primary',
      ],
      control: [
        'size-9 rounded-full',
        'border border-brand-primary bg-transparent text-brand-primary',
        // `--brand-primary`'s role in the theme is "interactive", so the
        // ring reads as a control on every ground (≈5:1 / 4.2:1 / 4.6:1
        // light, ≈7:1 / 5.5:1 / 4.5:1 dark against primary/secondary/brand
        // tint) — the tint hover below is the PRIMARY/SECONDARY case; the
        // BRAND_PRIMARY-tone compound variant swaps it for a solid fill.
        'hover:bg-brand-primary-muted',
        // A transparent outline getting an opaque `surface-2` fill on focus
        // (the base's default) reads as an unrelated swatch on a circle
        // that never fills at rest or on hover — keep it transparent here
        // so only the ring itself signals focus.
        'focus-visible:bg-transparent',
        // A brand-tone ring reads as interactive, so disabling this
        // variant swaps it for a neutral one instead of fading it — the
        // base's 50% opacity is overridden here, its pointer-events-none
        // still applies.
        'disabled:opacity-100 disabled:border-border-strong disabled:text-muted',
      ],
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: [],
      [BRAND_VARIANT.SECONDARY]: [],
      [BRAND_VARIANT.BRAND_PRIMARY]: [],
    },
  },
  compoundVariants: [
    {
      variant: 'control',
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      // `:hover` and `:focus-visible` can both match at once (mousing over
      // a tabbed-to control), and either can win the cascade — so the fill
      // and glyph for this pairing are pinned to the same values under
      // both pseudo-classes rather than left to whichever one wins.
      class: [
        'hover:bg-brand-primary-solid hover:text-brand-primary-contrast',
        'focus-visible:bg-brand-primary-solid focus-visible:text-brand-primary-contrast',
      ],
    },
  ],
});

export type TIconButtonVariants = VariantProps<typeof iconButtonVariants>;
