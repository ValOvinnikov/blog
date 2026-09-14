import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import type { SanityDocument } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };
type TPostListCardinalityDocument = { modules?: TModuleReference[] };

const MULTIPLE_POST_LIST_ERROR =
  'Only one Post List module is allowed per page.';

export const getPostListModuleRefs = (
  document: SanityDocument | undefined,
): string[] =>
  ((document as TPostListCardinalityDocument | undefined)?.modules ?? [])
    .filter((module) => module._type === postListSchema.name)
    .map((module) => module._ref)
    .filter((ref): ref is string => Boolean(ref));

/**
 * Document-level rule rejecting more than one `module_postList` reference —
 * a taxonomy page renders a single post list, so a second one is always a
 * mistake.
 */
export const validateSinglePostListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getPostListModuleRefs(document).length > 1 ? MULTIPLE_POST_LIST_ERROR : true;

/**
 * Document-level rule warning when no `module_postList` is referenced, with
 * page-specific wording for what stays empty until one is added.
 */
export const validateHasPostListModule =
  (noPostListWarning: string) =>
  (document: SanityDocument | undefined): string | true =>
    getPostListModuleRefs(document).length === 0 ? noPostListWarning : true;
