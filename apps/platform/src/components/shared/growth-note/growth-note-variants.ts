import { tv } from '@platform/utils/tv/tv';

export const growthNoteVariants = tv({
  slots: {
    root: [
      'overflow-hidden rounded-platform border border-platform-brand-line bg-platform-brand-weak shadow-platform',
    ],
    row: ['flex flex-wrap items-center gap-3 px-4 py-3.5'],
    icon: ['mt-0.5 self-start text-platform-brand'],
    text: ['min-w-50 flex-1'],
    title: ['block text-platform-13-5 font-semibold text-platform-text'],
    description: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
    chevron: ['text-platform-muted'],
    panel: [
      'flex flex-col gap-3.5 border-t border-platform-brand-line bg-platform-surface px-4 pt-3.5 pb-4 md:px-[18px] md:pt-4 md:pb-[18px]',
    ],
    list: ['grid grid-cols-1 gap-x-4 gap-y-0.5 md:grid-cols-2'],
    closing: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
  },
});
