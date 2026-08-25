import { tv } from 'tailwind-variants';

export const deprovisionTenantControlVariants = tv({
  slots: {
    card: [
      'flex flex-col gap-3 rounded-md border border-error/40 bg-surface p-6',
    ],
    archivedRow: ['flex flex-wrap items-center gap-3'],
    switchRow: ['flex items-center gap-2.5 text-sm text-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-secondary',
      'transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-surface shadow',
      'transition-transform duration-base ease-console',
      'data-[checked]:translate-x-4',
    ],
  },
});
