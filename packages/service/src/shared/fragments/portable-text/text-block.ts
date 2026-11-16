import type { ListedText, ParagraphText } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { portableTextMarkDefFragment } from '@shinefold/service/shared/fragments/portable-text/portable-text-mark-def';

export const textBlockFragment = q
  .fragment<ListedText[number] | ParagraphText[number]>()
  .project((sub) => ({
    '...': true,
    markDefs: sub
      .field('markDefs[]')
      .project(portableTextMarkDefFragment)
      .nullable(true),
  }));
