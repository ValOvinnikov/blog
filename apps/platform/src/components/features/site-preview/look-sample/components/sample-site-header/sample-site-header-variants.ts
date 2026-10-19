import { HEADER_CONTROL } from '@blog/ui/lib/styling';
import { tv } from '@platform/utils/tv/tv';

export const sampleSiteHeaderVariants = tv({
  slots: {
    root: [
      'flex items-center justify-between gap-3 border-b border-border pb-3',
    ],
    brand: ['flex items-center gap-2'],
    brandName: ['font-display text-base font-semibold text-text'],
    nav: ['flex items-center gap-4'],
    actions: ['flex items-center gap-2'],
    themeToggle: [HEADER_CONTROL, 'size-9 px-0'],
    signIn: [
      HEADER_CONTROL,
      'inline-flex shrink-0 items-center justify-center gap-1.5',
      'min-h-9 pl-3 pr-4 py-0',
    ],
    signInGlyph: ['text-muted'],
  },
  variants: {
    isNarrow: {
      true: {
        root: ['flex-nowrap'],
        brand: ['min-w-0'],
        brandName: ['truncate'],
      },
      false: { root: ['flex-wrap'] },
    },
  },
});
