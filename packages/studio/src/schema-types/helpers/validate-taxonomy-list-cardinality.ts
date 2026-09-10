import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import type { SanityDocument } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };
type TTaxonomyListCardinalityDocument = { modules?: TModuleReference[] };

const MULTIPLE_TAXONOMY_LIST_ERROR =
  'Only one Taxonomy List module is allowed per page.';

const getTaxonomyListModuleRefs = (
  document: SanityDocument | undefined,
): string[] =>
  ((document as TTaxonomyListCardinalityDocument | undefined)?.modules ?? [])
    .filter((module) => module._type === taxonomyListSchema.name)
    .map((module) => module._ref)
    .filter((ref): ref is string => Boolean(ref));

/**
 * Document-level rule rejecting more than one `module_taxonomyList`
 * reference — an index page renders a single taxonomy list, so a second one
 * is always a mistake regardless of which kind the page lists.
 */
export const validateSingleTaxonomyListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getTaxonomyListModuleRefs(document).length > 1
    ? MULTIPLE_TAXONOMY_LIST_ERROR
    : true;

/**
 * Document-level rule warning when no `module_taxonomyList` is referenced,
 * with page-specific wording for what stays empty until one is added.
 */
export const validateHasTaxonomyListModule =
  (noTaxonomyListWarning: string) =>
  (document: SanityDocument | undefined): string | true =>
    getTaxonomyListModuleRefs(document).length === 0
      ? noTaxonomyListWarning
      : true;
