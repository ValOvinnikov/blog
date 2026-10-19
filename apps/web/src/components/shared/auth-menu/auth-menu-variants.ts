import { HEADER_CONTROL, tv } from '@blog/ui/lib/styling';

export const SHEET_BELOW_LG = [
  'max-lg:fixed max-lg:inset-x-gutter max-lg:mt-0 max-lg:w-auto max-lg:max-w-none',
  'max-lg:top-[calc(var(--site-header-height,4.5rem)+0.5rem)]',
  'max-lg:max-h-[calc(100dvh-var(--site-header-height,4.5rem)-1rem)] max-lg:overflow-y-auto',
].join(' ');

export const authMenuVariants = tv({
  slots: {
    // A max-width alone is not enough: an absolute panel shrink-fits and wraps its items.
    panel: ['w-80 max-w-[calc(100vw-2rem)]', SHEET_BELOW_LG],
    signInTrigger: [
      'group gap-1.5 size-11 px-0',
      'lg:size-auto lg:pl-3 lg:pr-4',
    ],
    signInGlyph: [
      'lg:size-4 lg:text-muted',
      'lg:group-hover:text-current lg:group-aria-expanded:text-current',
    ],
    signInText: ['hidden lg:inline'],
    loading: ['inline-flex shrink-0'],
    loadingPlaceholder: ['lg:invisible [&>*]:invisible'],
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
