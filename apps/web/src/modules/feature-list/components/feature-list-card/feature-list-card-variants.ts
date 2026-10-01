import { tv } from 'tailwind-variants';

export const featureListCardVariants = tv({
  slots: {
    iconPanel: [
      'bg-brand-primary-muted text-brand-primary',
      'group-hover:bg-surface group-focus-within:bg-surface',
      'flex size-full items-center justify-center',
    ],
  },
});
