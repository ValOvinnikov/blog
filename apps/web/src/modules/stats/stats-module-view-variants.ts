import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const statsModuleViewVariants = tv({
  slots: {
    list: ['@container/figures flex w-full flex-wrap gap-x-10 gap-y-8'],
    item: ['flex min-w-36 flex-col gap-1'],
    value: ['order-1 tabular-nums whitespace-nowrap'],
    label: ['order-2 max-w-3xs'],
    description: ['order-3 max-w-3xs'],
    footnote: ['mt-5 max-w-measure'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        list: ['justify-start'],
        item: ['items-start text-left'],
        footnote: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        list: ['justify-center'],
        item: ['items-center text-center'],
        footnote: ['mx-auto text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        list: ['justify-end'],
        item: ['items-end text-right'],
        footnote: ['ml-auto text-right'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
