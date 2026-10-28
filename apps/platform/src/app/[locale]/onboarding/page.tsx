import { isLocaleIsoCode, LOCALE_ISO_CODES } from '@blog/config';
import { OnboardingView } from '@platform/components/features/onboarding/onboarding-view';
import { requireOnboardingUser } from '@platform/server/onboarding/require-onboarding-user';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { env } from '@platform/utils/env/env';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('onboarding');
}

export default async function OnboardingPage() {
  const [, locale] = await Promise.all([requireOnboardingUser(), getLocale()]);

  return (
    <OnboardingView
      rootDomain={env.TENANT_ROOT_DOMAIN}
      legalPageUrls={toLegalPageUrls()}
      initialLocale={isLocaleIsoCode(locale) ? locale : LOCALE_ISO_CODES.EN}
    />
  );
}
