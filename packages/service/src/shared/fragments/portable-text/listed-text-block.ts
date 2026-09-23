import type { ListedText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';

export const listedTextBlockFragment = q
  .fragment<ListedText[number]>()
  .project((sub) => ({
    '...': true,
    markDefs: sub
      .field('markDefs[]')
      .project(portableTextMarkDefFragment)
      .nullable(true),
  }));
