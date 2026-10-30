import { tv } from '@blog/ui/lib/styling';

export const footerGroupVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col gap-3',
      'group-data-[layout=CENTRED]/footer:contents',
    ],
    heading: [
      'font-mono text-label font-medium uppercase tracking-label text-text',
      'group-data-[layout=CENTRED]/footer:sr-only',
    ],
    list: [
      'flex flex-col gap-2',
      'group-data-[layout=CENTRED]/footer:flex-row group-data-[layout=CENTRED]/footer:flex-wrap group-data-[layout=CENTRED]/footer:justify-center',
      'group-data-[layout=CENTRED]/footer:gap-x-5 group-data-[layout=CENTRED]/footer:gap-y-2',
    ],
  },
});
