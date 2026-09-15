import type { RichText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { bodyImageFragment } from '@blog/service/shared/fragments/image';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text-mark-def';

// `code` is the only block type left unhandled below, so it's the only one
// `toPortableTextBody` needs to cast back to its full shape.
export const portableTextBodyItemFragment = q
  .fragment<RichText[number]>()
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
          .project((blockSub) => ({
            '...': true,
            markDefs: blockSub
              .field('markDefs[]')
              .project(portableTextMarkDefFragment)
              .nullable(true),
          }))
          .nullable(true),
      }),
    }),
  }));
