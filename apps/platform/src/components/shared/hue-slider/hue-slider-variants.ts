import { tv } from '@platform/utils/tv/tv';

export const hueSliderVariants = tv({
  slots: {
    root: ['min-w-24 flex-1 touch-none select-none'],
    control: ['flex items-center py-2'],
    track: [
      'relative h-3 w-full grow rounded-full bg-admin-line-2',
      'data-[disabled]:opacity-50',
    ],
    thumb: [
      'block size-5 rounded-full bg-white',
      'shadow-[0_1px_4px_rgba(0,0,0,.35),inset_0_0_0_1px_rgba(0,0,0,.08)]',
      'transition-colors',
      // The focusable element is the thumb's hidden range input, not the thumb itself.
      'has-[:focus-visible]:shadow-[0_0_0_2px_var(--admin-surface),0_0_0_4px_var(--admin-brand-ink)]',
      'data-[dragging]:shadow-[0_0_0_2px_var(--admin-surface),0_0_0_4px_var(--admin-brand-ink)]',
    ],
  },
});
