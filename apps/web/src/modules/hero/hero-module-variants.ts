import { BACKGROUND_TONE } from '@blog/config';
import { tv } from 'tailwind-variants';

export const heroHiddenLabelVariants = tv({
  base: ['sr-only'],
});

/**
 * Mirrors `Section`'s own `background` token mapping
 * (`packages/ui/src/atoms/section/section-variants.ts`) — `Hero` renders its
 * own full-bleed band rather than wrapping in `Section` (#1316), so it
 * re-applies the same tokens directly via `className`. No `background`
 * selected (`appearance.background` unset) resolves to `undefined` — today's
 * hardcoded background on `Hero`'s own root stays untouched.
 */
export const heroBackgroundVariants = tv({
  variants: {
    background: {
      [BACKGROUND_TONE.DEFAULT]: 'bg-bg',
      [BACKGROUND_TONE.SUBTLE]: 'bg-bg-subtle',
      [BACKGROUND_TONE.SURFACE]: 'bg-surface',
      [BACKGROUND_TONE.ACCENT_TINT]: 'bg-accent-muted',
      [BACKGROUND_TONE.INVERSE]: 'bg-text text-bg',
    },
  },
});
