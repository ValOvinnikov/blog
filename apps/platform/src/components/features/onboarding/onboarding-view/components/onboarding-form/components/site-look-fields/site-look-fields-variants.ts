import { tv } from '@platform/utils/tv/tv';

export const siteLookFieldsVariants = tv({
  slots: {
    preset: ['m-0 min-w-0 border-0 p-0'],
    legend: ['mb-1.5 p-0'],
    hint: ['mt-2.5 text-platform-12 leading-platform-1-45 text-platform-muted'],
    accent: ['flex flex-col gap-2.5'],
    label: ['text-platform-13-5 font-semibold text-platform-text'],
    row: ['flex min-h-11 items-center gap-3.5 md:min-h-9'],
  },
});
