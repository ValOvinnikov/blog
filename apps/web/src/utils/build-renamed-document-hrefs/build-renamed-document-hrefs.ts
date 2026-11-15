import { pageHref, routes, type TMaybeUndefined } from '@blog/config';
import type { TTenantPageLists } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import { toLastPage } from '@web/utils/build-next-page-paths';

export type TRenamedDocument = {
  type: string;
  slug: string;
  previousSlug: string;
};

// A landing page's address is its parent chain, which the webhook body does not carry.
const RENAMABLE_TYPES = new Set([
  'page_post',
  'page_topic',
  'page_tag',
  'page_privacyDocument',
  'page_legalDocument',
]);

const PAGINATED_TYPES = {
  page_topic: { list: 'topicPages', toPath: routes.topic },
  page_tag: { list: 'tagPages', toPath: routes.tag },
} as const satisfies Record<
  string,
  {
    list: keyof TTenantPageLists;
    toPath: (slug: string, page: number) => string;
  }
>;

const isPaginatedType = (type: string): type is keyof typeof PAGINATED_TYPES =>
  type in PAGINATED_TYPES;

const buildPreviousPaginationHrefs = (
  { type, slug, previousSlug }: TRenamedDocument,
  lists: TTenantPageLists,
): string[] => {
  if (!isPaginatedType(type)) {
    return [];
  }
  const { list, toPath } = PAGINATED_TYPES[type];
  const ownPages = lists[list].filter((page) => page.slug === slug);
  return [
    ...ownPages.map(({ page }) => toPath(previousSlug, Number(page))),
    toPath(previousSlug, toLastPage(ownPages) + 1),
  ];
};

export const buildRenamedDocumentHrefs = (
  renamed: TMaybeUndefined<TRenamedDocument>,
  lists: TTenantPageLists,
): string[] => {
  if (!renamed || !RENAMABLE_TYPES.has(renamed.type)) {
    return [];
  }
  const previousHref = pageHref(renamed.type, renamed.previousSlug);
  return [
    ...(previousHref ? [previousHref] : []),
    ...buildPreviousPaginationHrefs(renamed, lists),
  ];
};
