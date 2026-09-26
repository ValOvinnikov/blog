import type { ParagraphText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';

export const paragraphTextBlockFragment = q
  .fragment<ParagraphText[number]>()
  .project((sub) => ({
    '...': true,
    markDefs: sub
      .field('markDefs[]')
      .project(portableTextMarkDefFragment)
      .nullable(true),
  }));
