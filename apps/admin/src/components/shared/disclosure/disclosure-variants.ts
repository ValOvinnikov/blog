import { tv } from 'tailwind-variants';

export const disclosureVariants = tv({
  slots: {
    root: [
      'group overflow-hidden rounded-admin border border-admin-line shadow-admin',
    ],
    summary: [
      'flex cursor-pointer list-none items-center gap-2.5 bg-admin-surface px-[18px] py-[14px] text-sm font-semibold text-admin-text',
      'marker:hidden [&::-webkit-details-marker]:hidden',
    ],
    chevron: [
      'ml-auto shrink-0 text-admin-faint transition-transform group-open:rotate-90',
    ],
    inner: ['border-t border-admin-line-2 p-[18px]'],
  },
});
