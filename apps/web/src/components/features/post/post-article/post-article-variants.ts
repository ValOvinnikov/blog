import { tv } from '@blog/ui/lib/styling';
import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';

export const postArticleVariants = tv({
  slots: {
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mt-8', 'group-data-[depth=SKIM]/depth:hidden'],
    prose: proseMeasureCapSlot,
    coverImage: ['size-full object-cover'],
    metaActions: ['inline-flex items-center gap-2'],
  },
});
