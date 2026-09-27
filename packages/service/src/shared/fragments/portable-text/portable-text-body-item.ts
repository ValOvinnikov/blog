import type { ArticleText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { bodyImageFragment } from '@blog/service/shared/fragments/image/image';
import { paragraphTextBlockFragment } from '@blog/service/shared/fragments/portable-text/paragraph-text-block';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';

export const portableTextBodyItemFragment = q
  .fragment<ArticleText[number]>()
  .project((sub) => ({
    '...': true,
    ...sub.conditionalByType({
      block: (blockSub) => ({
        '...': true,
        markDefs: blockSub
          .field('markDefs[]')
          .project(portableTextMarkDefFragment)
          .nullable(true),
      }),
      bodyImage: (img) => ({
        layout: img.field('layout').nullable(true),
        ...bodyImageFragment,
      }),
      aside: (asideSub) => ({
        '...': true,
        body: asideSub
          .field('body[]')
          .project(paragraphTextBlockFragment)
          .nullable(true),
      }),
    }),
  }));
