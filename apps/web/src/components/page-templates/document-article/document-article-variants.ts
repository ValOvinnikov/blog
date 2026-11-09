import { tv } from '@blog/ui/lib/styling';
import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';

export const documentArticleVariants = tv({
  slots: {
    root: ['w-full', 'pb-page-y'],
    body: ['mt-8'],
    prose: proseMeasureCapSlot,
  },
});
