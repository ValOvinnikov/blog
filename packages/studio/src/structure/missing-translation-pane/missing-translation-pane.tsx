import {
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { Box, Card, Stack, Text } from '@sanity/ui';
import { IntentLink } from 'sanity/router';

type TMissingTranslationPaneParams = {
  schemaType: string;
  title: string;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  defaultDocumentId: string | undefined;
};

export const createMissingTranslationPane = ({
  schemaType,
  title,
  locale,
  defaultLocale,
  defaultDocumentId,
}: TMissingTranslationPaneParams) =>
  function MissingTranslationPane() {
    const language = LOCALE_NATIVE_LABEL[locale];
    const defaultLanguage = LOCALE_NATIVE_LABEL[defaultLocale];

    return (
      <Box padding={4}>
        <Card tone="caution" padding={4} radius={2} border={true}>
          <Stack gap={4}>
            <Text size={1}>
              There&apos;s no {language} {title} yet. Create it from the{' '}
              {defaultLanguage} {title}: choose {language} in its Translations
              menu, and the two stay linked.
            </Text>
            {defaultDocumentId ? (
              <Text size={1} weight="semibold">
                <IntentLink
                  intent="edit"
                  params={{ id: defaultDocumentId, type: schemaType }}
                >
                  Open the {defaultLanguage} {title}
                </IntentLink>
              </Text>
            ) : (
              <Text size={1}>
                Create the {defaultLanguage} {title} first.
              </Text>
            )}
          </Stack>
        </Card>
      </Box>
    );
  };
