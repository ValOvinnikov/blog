/** A `blog_post.categories[]` array item as it existed before #811. */
type TLegacyCategoryRef = {
  _ref: string;
  _type: string;
  _key: string;
};

/** The shape of a `blog_post` document that may still carry the legacy field. */
export type TLegacyPostDoc = { categories?: TLegacyCategoryRef[] };

/**
 * Pure transform: picks the first entry of the legacy `categories` array as
 * the new single `category` reference value. Exported so it's unit-testable
 * without a live dataset connection — see `./transform.test.ts`.
 */
export function categoriesToSingleCategory(
  doc: TLegacyPostDoc,
): { _type: 'reference'; _ref: string } | undefined {
  const [first] = doc.categories ?? [];
  return first ? { _type: 'reference', _ref: first._ref } : undefined;
}
