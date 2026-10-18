import { HEADER_CONTROL } from '@blog/ui/lib/styling';
import { tv } from 'tailwind-variants';

export const authMenuVariants = tv({
  slots: {
    // A max-width alone is not enough: an absolute panel shrink-fits and wraps its items.
    panel: ['w-80 max-w-[calc(100vw-2rem)]'],
    signInTrigger: ['group gap-1.5 pl-3 pr-4'],
    signInGlyph: [
      'text-muted group-hover:text-current group-aria-expanded:text-current',
    ],
    loading: ['inline-flex shrink-0'],
    loadingPlaceholder: ['invisible'],
    loadingStatus: ['sr-only'],
    avatarFrame: [
      HEADER_CONTROL,
      'inline-grid shrink-0 place-items-center p-0',
      'size-11 lg:size-9 pointer-coarse:size-11',
      'hover:ring-0',
    ],
    avatar: ['size-10 text-sm lg:size-8 lg:text-xs pointer-coarse:size-10'],
  },
});
