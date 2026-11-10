import { tv } from '@blog/ui/lib/styling';

export const accordionTriggerVariants = tv({
  slots: {
    header: ['m-0'],
    trigger: [
      'group flex w-[calc(100%+1rem)] items-center justify-between gap-3',
      '-mx-2 border-0 bg-transparent px-2 py-card-y text-left',
      'font-display text-lg font-medium text-text',
      'transition-colors duration-base ease-smooth',
      'hover:text-brand-primary',
      'rounded-sm focus-visible:outline-none',
      'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
    ],
    chevron: [
      'rotate-90 transition-transform duration-base ease-smooth',
      'group-data-panel-open:-rotate-90',
    ],
  },
});
