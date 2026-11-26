import { LANDING_PAGE_MAX_DEPTH } from '@shinefold/config/constants';
import { z } from 'zod';

import { LANDING_PAGE_PATH_EXPRESSION } from './landing-page-path';

const PAGE_FIELDS = `_id, "title": headingBlock.heading, "path": ${LANDING_PAGE_PATH_EXPRESSION}`;

function descendants(levels: number): string {
  const nested = levels > 1 ? `, "children": ${descendants(levels - 1)}` : '';

  return `*[_type == "page_landing" && parent._ref == ^._id && language == $locale] | order(orderRank) { ${PAGE_FIELDS}${nested} }`;
}

function node(scope: string): string {
  return `${scope}{ ${PAGE_FIELDS}, "sectionNavigation": coalesce(sectionNavigation, false), sectionNavigationTitle, "showPreviousNextLinks": coalesce(showPreviousNextLinks, true), "showSubPagesInNavigation": coalesce(showSubPagesInNavigation, false), "children": select(sectionNavigation == true => ${descendants(LANDING_PAGE_MAX_DEPTH - 1)}) }`;
}

const scopes = Array.from({ length: LANDING_PAGE_MAX_DEPTH }, (_, hops) =>
  hops === 0 ? '@' : 'parent->'.repeat(hops),
);

// groqd cannot build a projection nested to a depth set by a constant.
export const LANDING_PAGE_SECTION_CHAIN_EXPRESSION = `array::compact([${scopes.map(node).join(', ')}])`;

const sectionPageParser = z.object({
  _id: z.string(),
  title: z.string().nullable(),
  path: z.string().nullable(),
});

type TRawSectionTreePage = z.infer<typeof sectionPageParser> & {
  children?: TRawSectionTreePage[];
};

const sectionTreePageParser: z.ZodType<TRawSectionTreePage> =
  sectionPageParser.extend({
    get children() {
      return z.array(sectionTreePageParser).optional();
    },
  });

export const landingPageSectionChainParser = z.array(
  sectionPageParser.extend({
    sectionNavigation: z.boolean(),
    sectionNavigationTitle: z.string().nullable(),
    showPreviousNextLinks: z.boolean(),
    showSubPagesInNavigation: z.boolean(),
    children: z.array(sectionTreePageParser).nullable(),
  }),
);
