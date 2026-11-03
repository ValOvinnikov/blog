import { tv } from '@platform/utils/tv/tv';

export const siteLookFieldsVariants = tv({
  slots: {
    preset: ['m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0'],
    legend: ['mb-1.5 p-0'],
    hint: ['mt-1 text-admin-12 leading-[1.45] text-admin-muted'],
    accent: ['flex flex-col gap-2.5'],
    label: ['text-admin-13-5 font-semibold text-admin-text'],
    row: ['flex min-h-11 items-center gap-3.5 md:min-h-9'],
  },
});
