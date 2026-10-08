import { tv } from '@platform/utils/tv/tv';

export const itemListVariants = tv({
  slots: {
    root: ['hidden', 'flex-col', 'gap-1', 'lg:flex'],
    item: [
      'flex w-full flex-col items-start gap-1 rounded-admin px-3 py-2.5 text-left',
      'border border-transparent',
      'hover:bg-admin-surface-2',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand',
      'aria-[current=true]:border-admin-line aria-[current=true]:bg-admin-surface',
    ],
    label: ['text-[13.5px]', 'font-semibold', 'text-admin-text'],
    description: ['text-[12px]', 'text-admin-muted'],
  },
});
