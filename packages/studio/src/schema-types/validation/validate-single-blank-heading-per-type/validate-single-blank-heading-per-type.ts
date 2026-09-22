import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };

const BLANK_HEADING_ERROR =
  'Only one module of this type without its own heading is allowed per page — give this one a heading or remove the duplicate.';

/**
 * Builds a `modules[]` validator enforcing "at most one blank-heading
 * instance per listed type per page" — two instances of the same
 * heading-fallback module (e.g. `module_postLatest`) both left blank would
 * render duplicate landmark headings.
 */
export const validateSingleBlankHeadingPerType =
  (types: string[]) =>
  async (
    modules: TModuleReference[] | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const idsByType = new Map<string, string[]>();

    for (const module of modules ?? []) {
      if (!module._type || !module._ref || !types.includes(module._type)) {
        continue;
      }

      const ids = idsByType.get(module._type) ?? [];
      ids.push(module._ref);
      idsByType.set(module._type, ids);
    }

    const idsNeedingCheck = [...idsByType.values()].filter(
      (ids) => ids.length > 1,
    );

    if (idsNeedingCheck.length === 0) return true;

    const ids = idsNeedingCheck.flat();
    const failSafeAssumesEveryCandidateHasAHeading = ids.map((id) => ({
      id,
      heading: 'heading present',
    }));

    const candidates = await fetchDraftsFailSafe<
      { id: string; heading?: string | null }[]
    >(
      context,
      `*[_id in $ids]{ "id": _id, "heading": headingBlock.heading }`,
      { ids },
      failSafeAssumesEveryCandidateHasAHeading,
    );

    const headingById = new Map(
      candidates.map((candidate) => [candidate.id, candidate.heading]),
    );

    const hasDuplicateBlank = idsNeedingCheck.some(
      (ids) => ids.filter((id) => !headingById.get(id)?.trim()).length > 1,
    );

    return hasDuplicateBlank ? BLANK_HEADING_ERROR : true;
  };
