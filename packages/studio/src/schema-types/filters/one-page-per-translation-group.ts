import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import type { ReferenceFilterSearchOptions } from 'sanity';

const publishedId = (id: string) => `string::split(${id}, "drafts.")[-1]`;

const TRANSLATION_GROUP = `*[_type == "translation.metadata" && references(${publishedId('^._id')})][0]`;

const LIVE_TRANSLATIONS = `${TRANSLATION_GROUP}.translations[defined(value->)]`;

const ONE_PAGE_PER_TRANSLATION_GROUP_CONDITION = `(
  coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $defaultLanguage
  || !defined(${TRANSLATION_GROUP})
  || (
    count(${LIVE_TRANSLATIONS}[${LANGUAGE_FIELD} == $defaultLanguage]) == 0
    && ${LIVE_TRANSLATIONS}[0].value._ref == ${publishedId('_id')}
  )
)`;

/** Offers each translated page once: its default-language document, else one of its translations. */
export const onePagePerTranslationGroupFilter =
  (): ReferenceFilterSearchOptions => ({
    filter: ONE_PAGE_PER_TRANSLATION_GROUP_CONDITION,
    params: { defaultLanguage: getDefaultLanguage() },
  });
