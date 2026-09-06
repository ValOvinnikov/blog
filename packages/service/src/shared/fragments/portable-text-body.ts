import type { RichText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { bodyImageFragment } from '@blog/service/shared/fragments/image';

// Every non-`bodyImage` block is spread through unchanged; a `bodyImage`
// block additionally resolves its asset via `bodyImageFragment` so callers
// never see a bare asset reference.
export const portableTextBodyItemFragment = q
  .fragment<RichText[number]>()
  .project((sub) => ({
    '...': true,
    ...sub.conditionalByType({
      bodyImage: (img) => ({
        layout: img.field('layout').nullable(true),
        ...bodyImageFragment,
      }),
    }),
  }));
