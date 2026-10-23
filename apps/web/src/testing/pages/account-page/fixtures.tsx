import type { IAccountPageViewProps } from '@web/components/pages/account-page/account-page-view';
import { IdentitySectionView } from '@web/components/pages/account-page/sections/identity-section/identity-section-view';
import { NewsletterSectionView } from '@web/components/pages/account-page/sections/newsletter-section/newsletter-section-view';
import { PrivacySection } from '@web/components/pages/account-page/sections/privacy-section';

import { mockIdentitySectionView } from './identity-section-fixtures';
import { mockNewsletterSectionView } from './newsletter-section-fixtures';
import { mockPrivacySection } from './privacy-section-fixtures';

export const mockAccountPageView = (
  overrides: Partial<IAccountPageViewProps> = {},
): IAccountPageViewProps => {
  return {
    heading: 'Account',
    identitySection: <IdentitySectionView {...mockIdentitySectionView()} />,
    newsletterSection: (
      <NewsletterSectionView {...mockNewsletterSectionView()} />
    ),
    privacySection: <PrivacySection {...mockPrivacySection()} />,
    ...overrides,
  };
};
