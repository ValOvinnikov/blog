import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { LANGUAGE_FIELD } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { linkToDefaultTranslation } from '@shinefold/studio/schema-types/inputs/translation-link-input/link-to-default-translation';
import { STUDIO_API_VERSION } from '@shinefold/studio/studio-api-version';
import { hasLength, isString } from '@shinefold/utils/primitives';
import { useEffect, useRef } from 'react';
import {
  getPublishedId,
  type InputProps,
  useClient,
  useEditState,
  useFormValue,
} from 'sanity';

export type TTranslationLinkOptions = {
  schemaTypes: readonly string[];
  defaultLocale: TLocaleIsoCode;
};

const DefaultTranslationLink = ({
  schemaType,
  defaultLocale,
}: {
  schemaType: string;
  defaultLocale: TLocaleIsoCode;
}) => {
  const documentId = getPublishedId(String(useFormValue(['_id']) ?? ''));
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const { draft, published, ready } = useEditState(documentId, schemaType);
  const document = draft ?? published;
  const language = document?.[LANGUAGE_FIELD];
  const hasLinked = useRef(false);

  useEffect(() => {
    if (!documentId || !ready || !document || hasLinked.current) return;
    if (!isString(language) || !isLocaleIsoCode(language)) return;

    hasLinked.current = true;
    linkToDefaultTranslation(client, {
      documentId,
      schemaType,
      language,
      defaultLanguage: defaultLocale,
    }).catch(() => {
      hasLinked.current = false;
    });
  }, [
    client,
    defaultLocale,
    document,
    documentId,
    language,
    ready,
    schemaType,
  ]);

  return null;
};

export const createTranslationLinkInput = ({
  schemaTypes,
  defaultLocale,
}: TTranslationLinkOptions) =>
  function TranslationLinkInput(props: InputProps) {
    if (hasLength(props.path) || !schemaTypes.includes(props.schemaType.name)) {
      return props.renderDefault(props);
    }

    return (
      <>
        <DefaultTranslationLink
          schemaType={props.schemaType.name}
          defaultLocale={defaultLocale}
        />
        {props.renderDefault(props)}
      </>
    );
  };
