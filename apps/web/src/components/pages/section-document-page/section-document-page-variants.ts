import { tv } from '@blog/ui/lib/styling';
import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';

export const sectionDocumentPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    header: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mt-8'],
    prose: proseMeasureCapSlot,
  },
});
