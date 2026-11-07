import { tv } from '@platform/utils/tv/tv';

export const growthNoteVariants = tv({
  slots: {
    root: [
      'overflow-hidden rounded-admin border border-admin-brand-line bg-admin-brand-weak shadow-admin',
    ],
    row: ['flex flex-wrap items-center gap-3 px-4 py-3.5'],
    icon: ['mt-0.5 self-start text-admin-brand'],
    text: ['min-w-50 flex-1'],
    title: ['block text-admin-13-5 font-semibold text-admin-text'],
    description: ['text-admin-12-5 leading-admin-18 text-admin-muted'],
    chevron: ['text-admin-muted'],
    panel: [
      'flex flex-col gap-3.5 border-t border-admin-brand-line bg-admin-surface px-4 pt-3.5 pb-4 md:px-[18px] md:pt-4 md:pb-[18px]',
    ],
    list: ['grid grid-cols-1 gap-x-4 gap-y-0.5 md:grid-cols-2'],
    closing: ['text-admin-12-5 leading-admin-18 text-admin-muted'],
  },
});
