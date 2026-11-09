import { tv } from '@blog/ui/lib/styling';

export const tableVariants = tv({
  slots: {
    region: [
      'w-full overflow-x-auto overscroll-x-contain',
      '[--scroll-shadow:color-mix(in_oklch,var(--color-text)_20%,transparent)]',
      '[background-image:linear-gradient(to_right,var(--color-ambient)_40%,transparent),linear-gradient(to_left,var(--color-ambient)_40%,transparent),linear-gradient(to_right,var(--scroll-shadow),transparent),linear-gradient(to_left,var(--scroll-shadow),transparent)]',
      '[background-position:left_center,right_center,left_center,right_center]',
      '[background-size:2.5rem_100%,2.5rem_100%,0.75rem_100%,0.75rem_100%]',
      '[background-attachment:local,local,scroll,scroll]',
      'bg-no-repeat',
    ],
    table: [
      'w-full border-collapse',
      'text-left text-sm leading-normal text-text',
    ],
  },
});
