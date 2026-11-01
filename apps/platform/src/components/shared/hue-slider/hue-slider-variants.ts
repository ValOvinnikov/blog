import { tv } from '@platform/utils/tv/tv';

export const hueSliderVariants = tv({
  slots: {
    root: ['min-w-24 flex-1 self-stretch touch-none select-none'],
    control: ['flex h-full min-h-11 items-center md:min-h-9'],
    track: [
      'relative h-3 w-full grow rounded-admin bg-admin-line-2',
      'data-[disabled]:opacity-50',
    ],
    thumb: [
      'block size-5 rounded-full bg-white',
      'border border-admin-thumb-line shadow-admin-thumb',
      'transition-colors',
      // The focusable element is the thumb's hidden range input, not the thumb itself.
      'has-[:focus-visible]:not-data-[dragging]:shadow-[0_0_0_2px_var(--admin-surface),0_0_0_4px_var(--admin-brand-ink)]',
    ],
  },
});
