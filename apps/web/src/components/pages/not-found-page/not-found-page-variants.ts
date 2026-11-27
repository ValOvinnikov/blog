import {
  FOCUS_RING,
  LINK_UNDERLINE,
  TRANSITION_COLORS,
  tv,
} from '@shinefold/ui/lib/styling';

export const notFoundPageVariants = tv({
  slots: {
    root: [
      'bg-primary-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    copy: ['max-w-copy mx-auto'],
    link: [
      'inline-flex items-center gap-1.5',
      'text-brand-primary hover:text-brand-primary-hover',
      ...LINK_UNDERLINE,
      TRANSITION_COLORS,
      FOCUS_RING,
    ],
    arrow: ['size-4'],
  },
});
