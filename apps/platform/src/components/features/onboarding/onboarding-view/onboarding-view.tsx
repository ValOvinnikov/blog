import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';

import { OnboardingForm } from './components/onboarding-form';

export type TOnboardingViewProps = {
  rootDomain: TMaybeUndefined<string>;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  initialLocale: TLocaleIsoCode;
};

export const OnboardingView = ({
  rootDomain,
  legalPageUrls,
  initialLocale,
}: TOnboardingViewProps) => (
  <OnboardingForm
    rootDomain={rootDomain}
    legalPageUrls={legalPageUrls}
    initialLocale={initialLocale}
  />
);
