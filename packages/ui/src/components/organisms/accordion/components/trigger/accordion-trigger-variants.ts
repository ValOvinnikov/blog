import { tv } from '@blog/ui/lib/styling';

export const accordionTriggerVariants = tv({
  slots: {
    header: ['m-0'],
    trigger: [
      'group flex w-full items-center justify-between gap-3',
      'border-0 bg-transparent py-4 text-left',
      'font-display text-lg font-medium text-text',
      'transition-colors duration-base ease-smooth',
      'hover:text-brand-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    chevron: [
      'rotate-90 transition-transform duration-base ease-smooth',
      'group-data-panel-open:-rotate-90',
    ],
  },
});
