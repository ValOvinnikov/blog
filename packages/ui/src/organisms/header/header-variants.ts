import { tv } from 'tailwind-variants';

export const headerVariants = tv({
  slots: {
    root: [
      'flex items-center justify-between',
      'px-6 py-3',
      'bg-bg border-b border-border',
      'sticky top-0 z-10',
    ],
    brand: [
      'font-sans font-semibold text-lg',
      'text-fg',
      'transition-colors hover:text-accent',
      'mr-8',
    ],
    nav: ['flex items-center gap-4'],
    actions: ['flex items-center gap-2'],
  },
});
