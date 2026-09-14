import { LOCALE_ISO_CODES, type TThemeTokens } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { toThemeTokens } from '@web/utils/to-theme-tokens';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

type TNotFoundThemeContext = {
  messages: Record<string, unknown>;
  themeTokens: TThemeTokens;
};

const resolveTenantThemeContext = async (
  baseMessages: Record<string, unknown>,
  tenant: string,
): Promise<TNotFoundThemeContext> => {
  const [resolved, themeTokens] = await Promise.all([
    resolveTenantMessages(baseMessages, tenant),
    getThemeTokens(tenant),
  ]);

  return { messages: resolved.messages, themeTokens };
};

type TStandaloneNotFoundPageProps = {
  tenant?: string;
};

/**
 * StandaloneNotFoundPage — the body every `not-found.tsx` boundary outside
 * `[tenant]/[locale]/layout.tsx`'s children renders, since neither receives
 * route params to inherit theme/locale context from. Each caller resolves
 * its own tenant id (the root boundary from the request header, the
 * `[tenant]` boundary from what the layout remembered before it threw) and
 * passes it in; given one, this renders with that tenant's theme tokens and
 * voice-overridden messages, and otherwise falls back to default tokens and
 * base messages — never to a header read of its own.
 */
export const StandaloneNotFoundPage = async ({
  tenant,
}: TStandaloneNotFoundPageProps = {}) => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const baseMessages = await getMessages();

  const { messages, themeTokens } = tenant
    ? await resolveTenantThemeContext(baseMessages, tenant)
    : { messages: baseMessages, themeTokens: toThemeTokens(undefined) };

  return (
    <ThemeScope themeTokens={themeTokens}>
      <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
        <NotFoundPage />
      </NextIntlClientProvider>
    </ThemeScope>
  );
};
