import type { TValueOf } from '@blog/config/utils';

export const MODULE_PAGE_CONTEXT = {
  HOME: 'HOME',
  BLOG: 'BLOG',
  GENERIC: 'GENERIC',
  TOPIC: 'TOPIC',
  TAG: 'TAG',
} as const;

export type TModulePageContextType = TValueOf<typeof MODULE_PAGE_CONTEXT>;

type TModulePageContextScope =
  | { type: typeof MODULE_PAGE_CONTEXT.HOME }
  | { type: typeof MODULE_PAGE_CONTEXT.BLOG }
  | { type: typeof MODULE_PAGE_CONTEXT.GENERIC }
  | { type: typeof MODULE_PAGE_CONTEXT.TOPIC; topicSlug: string }
  | { type: typeof MODULE_PAGE_CONTEXT.TAG; tagSlug: string };

type TModulePagination =
  | { isPaginated: true; page: number; pageSize: number }
  | { isPaginated: false };

/**
 * Which page context a module is rendering inside, and whether that
 * placement paginates. A module in a page's required slot (e.g.
 * `postList`) gets its page number from the route; the same module type
 * inside `modules[]` never does — the discriminant makes `page`/`pageSize`
 * unreachable on the unpaginated branch at compile time.
 */
export type TModulePageContext = TModulePageContextScope & TModulePagination;
