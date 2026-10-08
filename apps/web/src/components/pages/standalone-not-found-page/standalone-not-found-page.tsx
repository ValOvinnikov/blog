import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { resolveNotFoundMessages } from '@web/utils/resolve-not-found-messages';
import { toThemeTokens } from '@web/utils/to-theme-tokens';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

type TStandaloneNotFoundPageProps = {
  tenant?: string;
  locale?: TLocaleIsoCode;
};

/** The body of every `not-found.tsx` boundary that renders outside `[tenant]/[locale]/layout.tsx`'s providers. */
export const StandaloneNotFoundPage = async ({
  tenant,
  locale = LOCALE_ISO_CODES.EN,
}: TStandaloneNotFoundPageProps = {}) => {
  setRequestLocale(locale);

  const [{ messages, rich }, themeTokens] = await Promise.all([
    resolveNotFoundMessages({ tenant, locale }),
    tenant ? getThemeTokens(tenant) : toThemeTokens(undefined),
  ]);

  return (
    <ThemeScope themeTokens={themeTokens}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NotFoundPage supportingText={rich.notFoundSupportingText} />
      </NextIntlClientProvider>
    </ThemeScope>
  );
};
