import { routes, type TModulePageContext } from '@blog/config';

type TPaginatedModulePageContext = Extract<
  TModulePageContext,
  { isPaginated: true }
>;

/**
 * Builds the pager's `createHref` for a paginated page context. `TOPIC`,
 * `TAG`, and `BLOG` are the only page kinds with a paginated route — `HOME`
 * and `GENERIC` never reach a paginated `PostListModule` by construction
 * (neither page kind's CMS schema allows a `postList` slot/module to
 * paginate), so hitting either branch is a real bug, not a URL to guess at.
 */
export const toPostListPaginationHref = (
  context: TPaginatedModulePageContext,
): ((page: number) => string) => {
  switch (context.type) {
    case 'TOPIC':
      return (page) => routes.topic(context.topicSlug, page);
    case 'TAG':
      return (page) => routes.tag(context.tagSlug, page);
    case 'BLOG':
      return (page) => routes.blogIndex(page);
    case 'HOME':
    case 'GENERIC':
      throw new Error(
        `PostListModule cannot paginate a ${context.type} page context — no paginated route exists for it.`,
      );
  }
};
