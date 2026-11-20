import { tv } from '@shinefold/ui/lib/styling';
import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';

export const postArticleVariants = tv({
  slots: {
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mt-8'],
    prose: proseMeasureCapSlot,
    coverImage: ['size-full object-cover'],
  },
});
