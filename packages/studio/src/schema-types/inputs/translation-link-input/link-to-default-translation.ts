import type { TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import type { Mutation } from '@sanity/client';
import { getDraftId, getPublishedId } from 'sanity';

const METADATA_TYPE = 'translation.metadata';

type TTranslationLinkClient = {
  fetch: <TResult>(
    query: string,
    params: Record<string, unknown>,
  ) => Promise<TResult>;
  mutate: (mutations: Mutation[]) => Promise<unknown>;
};

type TLinkToDefaultTranslationParams = {
  documentId: string;
  schemaType: string;
  language: TLocaleIsoCode;
  defaultLanguage: TLocaleIsoCode;
};

type TSource = { sourceId: string | null; isLinked: boolean };
type TMetadata = { _id: string; languages: (string | null)[] | null } | null;

const SOURCE_QUERY = `{
  "isLinked": count(*[_type == "${METADATA_TYPE}" && references($id)]) > 0,
  "sourceId": *[_type == $type && !(_id in [$id, $draftId]) && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $defaultLanguage] | order(_updatedAt desc)[0]._id
}`;

const METADATA_QUERY = `*[_type == "${METADATA_TYPE}" && references($sourceId)][0]{ _id, "languages": translations[].${LANGUAGE_FIELD} }`;

const translationReference = (
  language: TLocaleIsoCode,
  documentId: string,
  schemaType: string,
) => ({
  _key: crypto.randomUUID(),
  _type: 'internationalizedArrayReferenceValue',
  [LANGUAGE_FIELD]: language,
  value: {
    _type: 'reference',
    _ref: documentId,
    _weak: true,
    _strengthenOnPublish: { type: schemaType },
  },
});

export const linkToDefaultTranslation = async (
  client: TTranslationLinkClient,
  {
    documentId,
    schemaType,
    language,
    defaultLanguage,
  }: TLinkToDefaultTranslationParams,
): Promise<void> => {
  if (language === defaultLanguage) return;

  const id = getPublishedId(documentId);
  const { sourceId, isLinked } = await client.fetch<TSource>(SOURCE_QUERY, {
    id,
    draftId: getDraftId(id),
    type: schemaType,
    defaultLanguage,
  });

  if (isLinked || !sourceId) return;

  const source = getPublishedId(sourceId);
  const metadata = await client.fetch<TMetadata>(METADATA_QUERY, {
    sourceId: source,
  });

  if (metadata?.languages?.includes(language)) return;

  const reference = translationReference(language, id, schemaType);

  await client.mutate(
    metadata
      ? [
          {
            patch: {
              id: metadata._id,
              setIfMissing: { translations: [] },
              insert: { after: 'translations[-1]', items: [reference] },
            },
          },
        ]
      : [
          {
            create: {
              _id: crypto.randomUUID(),
              _type: METADATA_TYPE,
              schemaTypes: [schemaType],
              translations: [
                translationReference(defaultLanguage, source, schemaType),
                reference,
              ],
            },
          },
        ],
  );
};
