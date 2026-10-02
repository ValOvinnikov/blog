import type { TLocaleIsoCode } from '@blog/config/constants';

export type TRawTranslation = { language: TLocaleIsoCode; slug: string };

const TRANSLATION_METADATA_TYPE = 'translation.metadata';

export function buildTranslationsExpression(): string {
  const metadata = `*[_type == "${TRANSLATION_METADATA_TYPE}" && references(^._id)][0]`;

  return `coalesce(${metadata}.translations[defined(value->slug.current)]{"language": language, "slug": value->slug.current}, [{"language": coalesce(language, $defaultLocale), "slug": slug.current}])`;
}
