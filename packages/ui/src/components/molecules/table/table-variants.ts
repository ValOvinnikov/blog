import { tv } from '@shinefold/ui/lib/styling';

export const tableVariants = tv({
  slots: {
    region: [
      'w-full overflow-x-auto overscroll-x-contain rounded-card',
      // Raw tokens, not --color-*: a @theme token resolves on :root, so a band's --ambient would never reach it.
      '[--scroll-shadow:color-mix(in_oklch,var(--text)_20%,transparent)]',
      '[background-image:linear-gradient(to_right,var(--ambient)_40%,transparent),linear-gradient(to_left,var(--ambient)_40%,transparent),linear-gradient(to_right,var(--scroll-shadow),transparent),linear-gradient(to_left,var(--scroll-shadow),transparent)]',
      '[background-position:left_center,right_center,left_center,right_center]',
      '[background-size:2.5rem_100%,2.5rem_100%,0.75rem_100%,0.75rem_100%]',
      '[background-attachment:local,local,scroll,scroll]',
      'bg-no-repeat',
    ],
    table: [
      'w-full border-separate border-spacing-0',
      'rounded-card border border-divider',
      'text-left text-base leading-normal text-text',
    ],
  },
});
