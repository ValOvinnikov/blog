import { LOCALE_ISO_CODES } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

/**
 * StandaloneNotFoundPage — the body every `not-found.tsx` boundary outside
 * `[tenant]/[locale]/layout.tsx` renders (the root `app/not-found.tsx` for
 * unmatched URLs, and `app/[tenant]/not-found.tsx` for a `notFound()` thrown
 * by that layout itself). Both sit above or outside that layout, so it
 * resolves its own theme tokens and locale messages rather than inheriting
 * them — `getThemeTokens`/`resolveTenantMessages` fall through to the
 * `x-tenant-id` request header when called with no `tenant` argument, since
 * neither boundary receives route params.
 */
export const StandaloneNotFoundPage = async () => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const [baseMessages, themeTokens] = await Promise.all([
    getMessages(),
    getThemeTokens(),
  ]);
  const { messages } = await resolveTenantMessages(baseMessages);

  return (
    <ThemeScope themeTokens={themeTokens}>
      <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
        <NotFoundPage />
      </NextIntlClientProvider>
    </ThemeScope>
  );
};
