import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
  type TThemeTokens,
} from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { toThemeTokens } from '@web/utils/to-theme-tokens';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

type TNotFoundThemeContext = {
  messages: Record<string, unknown>;
  themeTokens: TThemeTokens;
};

const resolveTenantThemeContext = async (
  baseMessages: Record<string, unknown>,
  tenant: string,
  hasVoiceOverrides: boolean,
): Promise<TNotFoundThemeContext> => {
  const [messages, themeTokens] = await Promise.all([
    hasVoiceOverrides
      ? resolveTenantMessages(baseMessages, tenant).then(
          (resolved) => resolved.messages,
        )
      : baseMessages,
    getThemeTokens(tenant),
  ]);

  return { messages, themeTokens };
};

type TStandaloneNotFoundPageProps = {
  tenant?: string;
  locale?: TLocaleIsoCode;
  hasVoiceOverrides?: boolean;
};

/** The body of every `not-found.tsx` boundary that renders outside `[tenant]/[locale]/layout.tsx`'s providers. */
export const StandaloneNotFoundPage = async ({
  tenant,
  locale = LOCALE_ISO_CODES.EN,
  hasVoiceOverrides = true,
}: TStandaloneNotFoundPageProps = {}) => {
  setRequestLocale(locale);
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];

  const { messages, themeTokens } = tenant
    ? await resolveTenantThemeContext(baseMessages, tenant, hasVoiceOverrides)
    : { messages: baseMessages, themeTokens: toThemeTokens(undefined) };

  return (
    <ThemeScope themeTokens={themeTokens}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NotFoundPage />
      </NextIntlClientProvider>
    </ThemeScope>
  );
};
