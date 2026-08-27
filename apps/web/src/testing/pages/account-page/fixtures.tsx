import type { IAccountPageViewProps } from '@web/components/pages/account-page';
import { IdentitySectionView } from '@web/components/pages/account-page/sections/identity-section';
import { NewsletterSectionView } from '@web/components/pages/account-page/sections/newsletter-section';
import { PrivacySection } from '@web/components/pages/account-page/sections/privacy-section';

import { makeIdentitySectionView } from './identity-section-fixtures';
import { makeNewsletterSectionView } from './newsletter-section-fixtures';
import { makePrivacySection } from './privacy-section-fixtures';

export const makeAccountPageView = (
  overrides: Partial<IAccountPageViewProps> = {},
): IAccountPageViewProps => {
  return {
    heading: 'Account',
    identitySection: <IdentitySectionView {...makeIdentitySectionView()} />,
    newsletterSection: (
      <NewsletterSectionView {...makeNewsletterSectionView()} />
    ),
    privacySection: <PrivacySection {...makePrivacySection()} />,
    ...overrides,
  };
};
