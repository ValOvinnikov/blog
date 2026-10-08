import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { z } from 'zod';

import { LANDING_PAGE_PATH_EXPRESSION } from './landing-page-path';

const PAGE_FIELDS = `_id, "title": headingBlock.heading, "path": ${LANDING_PAGE_PATH_EXPRESSION}`;

const CHILDREN_EXPRESSION = `*[_type == "page_landing" && parent._ref == ^._id && language == $locale] | order(orderRank) { ${PAGE_FIELDS} }`;

function node(scope: string): string {
  return `${scope}{ ${PAGE_FIELDS}, "sectionNavigation": coalesce(sectionNavigation, false), sectionNavigationTitle, "children": select(sectionNavigation == true => ${CHILDREN_EXPRESSION}) }`;
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

export const landingPageSectionChainParser = z.array(
  sectionPageParser.extend({
    sectionNavigation: z.boolean(),
    sectionNavigationTitle: z.string().nullable(),
    children: z.array(sectionPageParser).nullable(),
  }),
);
