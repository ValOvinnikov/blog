import { OnboardingView } from '@platform/components/features/onboarding/onboarding-view/onboarding-view';
import { ONBOARDING_TIER_QUERY } from '@platform/constants/onboarding';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender } from '@platform/testing/custom-render';
import { MOCK_LEGAL_PAGE_URLS } from '@platform/testing/legal-page-urls';
import { stubChangingMediaQueries } from '@platform/testing/match-media';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import { LOCALE_ISO_CODES } from '@shinefold/config';

export const setup = customRender(OnboardingView, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
  legalPageUrls: MOCK_LEGAL_PAGE_URLS,
  initialLocale: LOCALE_ISO_CODES.EN,
  accountEmail: MOCK_SIGN_IN_EMAIL,
});

export const FULL_TIER = [
  ONBOARDING_TIER_QUERY.RAIL,
  ONBOARDING_TIER_QUERY.FULL,
];
export const RAIL_TIER = [ONBOARDING_TIER_QUERY.RAIL];
export const FULL_TIER_TITLE = 'from 1104px';
export const RAIL_TIER_TITLE = 'from 768px';

export const renderInTier = (matchingQueries: readonly string[]) => {
  const resizeTo = stubChangingMediaQueries(matchingQueries);
  setup();
  return resizeTo;
};
