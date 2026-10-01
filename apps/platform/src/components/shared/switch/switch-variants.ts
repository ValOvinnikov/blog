import { tv } from '@platform/utils/tv/tv';

export const switchVariants = tv({
  slots: {
    track: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-admin-line',
      'transition-colors duration-150',
      'data-[checked]:bg-admin-brand',
      'data-[disabled]:cursor-not-allowed',
      'outline-hidden focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:outline-offset-2',
    ],
    thumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-admin-surface shadow-admin',
      'transition-transform duration-150',
      'data-[checked]:translate-x-4',
    ],
    label: ['text-[13px] text-admin-text'],
  },
});
