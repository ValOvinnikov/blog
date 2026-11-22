import { OnboardingView } from '@platform/components/features/onboarding/onboarding-view';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveLegalPageUrls } from '@platform/server/legal-pages/resolve-legal-page-urls';
import { requireOnboardingUser } from '@platform/server/onboarding/require-onboarding-user';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { env } from '@platform/utils/env/env';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { isLocaleIsoCode, LOCALE_ISO_CODES } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('onboarding');
}

export default async function OnboardingPage() {
  const [, locale, accountEmail, legalPageUrls] = await Promise.all([
    requireOnboardingUser(),
    getLocale(),
    getSessionEmail(),
    resolveLegalPageUrls(
      toLegalPageUrls({
        marketingSiteUrl: env.MARKETING_SITE_URL,
        rootDomain: env.TENANT_ROOT_DOMAIN,
      }),
    ),
  ]);

  return (
    <PoweredByMarkProvider
      hasPoweredByMark={PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH].hasPoweredByMark}
    >
      <OnboardingView
        rootDomain={env.TENANT_ROOT_DOMAIN}
        legalPageUrls={legalPageUrls}
        initialLocale={isLocaleIsoCode(locale) ? locale : LOCALE_ISO_CODES.EN}
        accountEmail={accountEmail}
      />
    </PoweredByMarkProvider>
  );
}
