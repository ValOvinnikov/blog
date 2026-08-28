/** A `module_cta`/`module_newsletter` document as it existed before this migration. */
export type TLegacyHeadingSourceDoc = {
  heading?: string;
  text?: string;
  description?: string;
  sectionHeader?: unknown;
};

export type TSectionHeaderValue = {
  heading?: string;
  supportingText?: string;
};

/**
 * Pure transform: builds the new `sectionHeader` object from a doc's legacy
 * `heading`/`text`/`description` fields. `text` (module_cta) and
 * `description` (module_newsletter) both map onto `supportingText` — the two
 * document types never carry both, so there's no ambiguity in reading
 * whichever is present. Exported so it's unit-testable without a live
 * dataset connection — see `./transform.test.ts`.
 */
export const headingFieldsToSectionHeader = (
  doc: TLegacyHeadingSourceDoc,
): TSectionHeaderValue | undefined => {
  if (doc.sectionHeader !== undefined) return undefined;

  const { heading, text, description } = doc;
  const supportingText = text ?? description;
  if (!heading && !supportingText) return undefined;

  return {
    ...(heading ? { heading } : {}),
    ...(supportingText ? { supportingText } : {}),
  };
};

/** A `module_postList` document as it existed before this migration. */
export type TLegacyPostListDoc = {
  title?: string;
  sectionHeader?: unknown;
};

/**
 * Pure transform: copies `title` (module_postList's former dual-purpose
 * display heading) onto the new `sectionHeader.heading`. Unlike
 * `headingFieldsToSectionHeader`, `title` is not cleared — module_postList
 * keeps `title` as a purely internal Studio label going forward, so the
 * value lives in both places after migration.
 */
export const postListTitleToSectionHeader = (
  doc: TLegacyPostListDoc,
): TSectionHeaderValue | undefined => {
  if (doc.sectionHeader !== undefined) return undefined;
  if (!doc.title) return undefined;

  return { heading: doc.title };
};
