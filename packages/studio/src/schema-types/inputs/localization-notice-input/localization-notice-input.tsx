import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { isLocalizedSchemaType } from '@blog/studio/schema-types/inputs/localization-notice-input/is-localized-schema-type';
import {
  collectMissingLocales,
  formatLocaleList,
  getMissingTranslations,
  LOCALE_LABEL,
} from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import {
  formatUntranslatedTargetNotice,
  getUntranslatedTargetLocales,
} from '@blog/studio/schema-types/inputs/localization-notice-input/untranslated-target';
import { Card, Stack, Text } from '@sanity/ui';
import { useEffect, useState } from 'react';
import { type InputProps, useClient } from 'sanity';

const LINK_TYPE_NAME = 'link';
const TRANSLATIONS_API_VERSION = '2024-01-01';
const TARGET_TRANSLATIONS_QUERY =
  '*[_type == "translation.metadata" && references($id)][0].translations[].language';

export type TLocalizationNoticeOptions = {
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
};

const Notice = ({ children }: { children: string }) => (
  <Card tone="caution" padding={3} radius={2} border={true}>
    <Text size={1}>{children}</Text>
  </Card>
);

const documentNotices = (
  value: unknown,
  liveLocales: readonly TLocaleIsoCode[],
): string[] => {
  const notices: string[] = [];
  const language =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)[LANGUAGE_FIELD]
      : undefined;

  if (
    typeof language === 'string' &&
    isLocaleIsoCode(language) &&
    !liveLocales.includes(language)
  ) {
    notices.push(
      `${LOCALE_LABEL[language]} isn't live on your plan — this won't appear on the site.`,
    );
  }

  const missing = collectMissingLocales(value, liveLocales);
  if (missing.length > 0) {
    notices.push(
      `Missing translations: ${formatLocaleList(missing)}. The default language is shown instead.`,
    );
  }

  return notices;
};

const fieldNotices = (
  value: unknown,
  liveLocales: readonly TLocaleIsoCode[],
): string[] => {
  const missing = getMissingTranslations(value, liveLocales);

  return missing.length > 0 ? [`Missing: ${formatLocaleList(missing)}.`] : [];
};

const referencedId = (value: unknown): string | undefined => {
  const reference =
    typeof value === 'object' && value !== null
      ? (value as { internalReference?: { _ref?: unknown } }).internalReference
      : undefined;

  return typeof reference?._ref === 'string' ? reference._ref : undefined;
};

const useUntranslatedTargetNotices = (
  targetId: string | undefined,
  { liveLocales, defaultLocale }: TLocalizationNoticeOptions,
): string[] => {
  const client = useClient({ apiVersion: TRANSLATIONS_API_VERSION });
  const [fetched, setFetched] = useState<{
    id: string;
    languages: unknown[];
  }>();

  useEffect(() => {
    if (!targetId) return;

    let isCurrent = true;
    client
      .fetch<unknown[] | null>(TARGET_TRANSLATIONS_QUERY, { id: targetId })
      .then((languages) => {
        if (isCurrent) setFetched({ id: targetId, languages: languages ?? [] });
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [client, targetId]);

  if (!targetId || fetched?.id !== targetId) return [];

  return getUntranslatedTargetLocales(
    fetched.languages,
    liveLocales,
    defaultLocale,
  ).map((locale) => formatUntranslatedTargetNotice(locale, defaultLocale));
};

const NoticeStack = ({
  notices,
  children,
}: {
  notices: string[];
  children: React.ReactNode;
}) =>
  notices.length === 0 ? (
    children
  ) : (
    <Stack gap={4}>
      {notices.map((notice) => (
        <Notice key={notice}>{notice}</Notice>
      ))}
      {children}
    </Stack>
  );

const LinkDocumentNotices = ({
  props,
  options,
}: {
  props: InputProps;
  options: TLocalizationNoticeOptions;
}) => {
  const targetNotices = useUntranslatedTargetNotices(
    referencedId(props.value),
    options,
  );

  return (
    <NoticeStack
      notices={[
        ...documentNotices(props.value, options.liveLocales),
        ...targetNotices,
      ]}
    >
      {props.renderDefault(props)}
    </NoticeStack>
  );
};

export const createLocalizationNoticeInput = (
  options: TLocalizationNoticeOptions,
) => {
  const { liveLocales } = options;

  return function LocalizationNoticeInput(props: InputProps) {
    if (props.path.length === 0 && props.schemaType.name === LINK_TYPE_NAME) {
      return <LinkDocumentNotices props={props} options={options} />;
    }

    const notices =
      props.path.length === 0
        ? documentNotices(props.value, liveLocales)
        : isLocalizedSchemaType(props.schemaType)
          ? fieldNotices(props.value, liveLocales)
          : [];

    return (
      <NoticeStack notices={notices}>{props.renderDefault(props)}</NoticeStack>
    );
  };
};
