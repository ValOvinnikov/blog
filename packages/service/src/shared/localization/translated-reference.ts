export const TRANSLATION_METADATA_TYPE = 'translation.metadata' as const;

export function buildTranslatedReferenceExpression(
  referenceField: string,
): string {
  const metadata = `*[_type == "${TRANSLATION_METADATA_TYPE}" && references(^.${referenceField}._ref)][0]`;

  return `coalesce(${metadata}.translations[language == $locale][0].value->, ${metadata}.translations[language == $defaultLocale][0].value->, ${referenceField}->)`;
}
