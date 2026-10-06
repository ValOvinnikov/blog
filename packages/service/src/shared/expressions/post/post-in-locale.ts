export const POST_IN_LOCALE_FILTER = 'language == $locale';

/** Resolves a pinned post reference to its version in the request language, or to nothing. */
export function buildPinnedPostInLocaleFilter(referencePath: string): string {
  return `${POST_IN_LOCALE_FILTER} && (_id == ^.${referencePath} || _id in *[_type == "translation.metadata" && references(^.^.${referencePath})].translations[].value._ref)`;
}
