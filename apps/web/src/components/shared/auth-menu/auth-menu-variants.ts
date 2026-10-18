import { tv } from 'tailwind-variants';

const AVATAR_FOOTPRINT = 'size-11 shrink-0 lg:size-8';

export const authMenuVariants = tv({
  slots: {
    // A max-width alone is not enough: an absolute panel shrink-fits and wraps its items.
    panel: ['w-80 max-w-[calc(100vw-2rem)]'],
    avatar: [AVATAR_FOOTPRINT],
    statusIndicator: [
      AVATAR_FOOTPRINT,
      'inline-grid place-items-center rounded-full bg-primary-subtle',
    ],
  },
});
