import { faker } from '@faker-js/faker';
import type { IAccountPageViewProps } from '@web/components/pages/account-page/account-page-view';
import { IdentitySectionView } from '@web/components/pages/account-page/sections/identity-section/identity-section-view';
import { NewsletterSectionView } from '@web/components/pages/account-page/sections/newsletter-section/newsletter-section-view';
import { PrivacySection } from '@web/components/pages/account-page/sections/privacy-section';

import { mockIdentitySectionView } from './identity-section-fixtures';
import { mockNewsletterSectionView } from './newsletter-section-fixtures';
import { mockPrivacySection } from './privacy-section-fixtures';

faker.seed(61031);

const MOCK_ACCOUNT_HEADING = faker.lorem.words(2);

export const mockAccountPageView = (
  overrides: Partial<IAccountPageViewProps> = {},
): IAccountPageViewProps => {
  return {
    heading: MOCK_ACCOUNT_HEADING,
    identitySection: <IdentitySectionView {...mockIdentitySectionView()} />,
    newsletterSection: (
      <NewsletterSectionView {...mockNewsletterSectionView()} />
    ),
    privacySection: <PrivacySection {...mockPrivacySection()} />,
    ...overrides,
  };
};
