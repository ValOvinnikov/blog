import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import {
  collectMissingLocales,
  formatLocaleList,
  getMissingLocales,
  LOCALE_LABEL,
} from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { Card, Stack, Text } from '@sanity/ui';
import type { InputProps, SchemaType } from 'sanity';

const LANGUAGE_FIELD = 'language';

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

const isLocalizedSchemaType = (schemaType: SchemaType | undefined): boolean =>
  schemaType !== undefined &&
  (schemaType.name.startsWith('internationalizedArray') ||
    isLocalizedSchemaType(schemaType.type));

const fieldNotices = (
  value: unknown,
  liveLocales: readonly TLocaleIsoCode[],
): string[] => {
  const missing = getMissingLocales(value, liveLocales);

  return missing.length > 0 ? [`Missing: ${formatLocaleList(missing)}.`] : [];
};

export const createLocalizationNoticeInput = (
  liveLocales: readonly TLocaleIsoCode[],
) => {
  return function LocalizationNoticeInput(props: InputProps) {
    const notices =
      props.path.length === 0
        ? documentNotices(props.value, liveLocales)
        : isLocalizedSchemaType(props.schemaType)
          ? fieldNotices(props.value, liveLocales)
          : [];

    if (notices.length === 0) {
      return props.renderDefault(props);
    }

    return (
      <Stack gap={4}>
        {notices.map((notice) => (
          <Notice key={notice}>{notice}</Notice>
        ))}
        {props.renderDefault(props)}
      </Stack>
    );
  };
};
