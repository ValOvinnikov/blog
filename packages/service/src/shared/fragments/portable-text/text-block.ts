import type { ListedText, ParagraphText } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';

export const textBlockFragment = q
  .fragment<ListedText[number] | ParagraphText[number]>()
  .project((sub) => ({
    '...': true,
    markDefs: sub
      .field('markDefs[]')
      .project(portableTextMarkDefFragment)
      .nullable(true),
  }));
