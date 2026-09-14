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
): Promise<TNotFoundThemeContext> => {
  const [resolved, themeTokens] = await Promise.all([
    resolveTenantMessages(baseMessages),
    getThemeTokens(),
  ]);

  return { messages: resolved.messages, themeTokens };
};

type TStandaloneNotFoundPageProps = {
  shouldResolveTenant?: boolean;
};

/**
 * StandaloneNotFoundPage — the body every `not-found.tsx` boundary outside
 * `[tenant]/[locale]/layout.tsx`'s children renders, since neither receives
 * route params to inherit theme/locale context from. The root
 * `app/not-found.tsx` (an unmatched URL, genuinely tenant-less) uses the
 * default `shouldResolveTenant={true}`, which falls through to the
 * `x-tenant-id` request header. `app/[tenant]/not-found.tsx` (a failed
 * `[tenant]/[locale]/layout.tsx` render) passes `shouldResolveTenant={false}`
 * to render with default theme tokens and base messages instead — the
 * layout that would have supplied a tenant just failed, and reading the
 * header here would turn a prerendered route dynamic at runtime.
 */
export const StandaloneNotFoundPage = async ({
  shouldResolveTenant = true,
}: TStandaloneNotFoundPageProps = {}) => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const baseMessages = await getMessages();

  const { messages, themeTokens } = shouldResolveTenant
    ? await resolveTenantThemeContext(baseMessages)
    : { messages: baseMessages, themeTokens: toThemeTokens(undefined) };

  return (
    <ThemeScope themeTokens={themeTokens}>
      <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
        <NotFoundPage />
      </NextIntlClientProvider>
    </ThemeScope>
  );
};
