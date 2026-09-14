import type { ProseText, RichText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { bodyImageFragment } from '@blog/service/shared/fragments/image';
import { sharedLinkAnnotationFragment } from '@blog/service/shared/fragments/link';

// Resolves each `sharedLinkAnnotation` mark's `link` reference to its
// destination; the `href`-based `link` mark needs no resolution and is left
// as authored via the `'...': true` at each call site below.
const markDefsFragment = q.fragment<ProseText[number]>().project((sub) => ({
  markDefs: sub
    .field('markDefs[]')
    .project((markDefSub) => ({
      '...': true,
      ...markDefSub.conditionalByType({
        sharedLinkAnnotation: () => ({ ...sharedLinkAnnotationFragment }),
      }),
    }))
    .nullable(true),
}));

// `proseText` (e.g. author `bio`) has no `bodyImage`/`code`/`aside`
// variants — every item is a block, so this resolves markDefs directly
// rather than going through `conditionalByType` at the item level.
export const proseTextBodyItemFragment = q
  .fragment<ProseText[number]>()
  .project({
    '...': true,
    ...markDefsFragment,
  });

// Every non-`bodyImage` block is spread through unchanged; a `bodyImage`
// block additionally resolves its asset via `bodyImageFragment`, a text
// `block` additionally resolves its markDefs, and an `aside` block
// resolves its nested `body` (itself `proseText`) the same way.
export const portableTextBodyItemFragment = q
  .fragment<RichText[number]>()
  .project((sub) => ({
    '...': true,
    ...sub.conditionalByType({
      bodyImage: (img) => ({
        layout: img.field('layout').nullable(true),
        ...bodyImageFragment,
      }),
      block: () => ({ ...markDefsFragment }),
      aside: (asideSub) => ({
        body: asideSub
          .field('body[]')
          .project(proseTextBodyItemFragment)
          .nullable(true),
      }),
    }),
  }));
