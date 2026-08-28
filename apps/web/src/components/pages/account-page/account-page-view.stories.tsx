import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeAccountPageView } from '@web/testing/pages/account-page/fixtures';
import { makeIdentitySectionView } from '@web/testing/pages/account-page/identity-section-fixtures';
import { makeNewsletterSectionView } from '@web/testing/pages/account-page/newsletter-section-fixtures';
import { makePrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import { AccountPageView } from './account-page-view';
import { IdentitySectionView } from './sections/identity-section';
import { NewsletterSectionView } from './sections/newsletter-section';
import { PrivacySection } from './sections/privacy-section';

const meta = {
  title: 'Pages/AccountPageView',
  component: AccountPageView,
  tags: ['autodocs'],
  args: makeAccountPageView(),
} satisfies Meta<typeof AccountPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoNewsletterSection: TStory = {
  args: {
    newsletterSection: undefined,
  },
};

export const Plain: TStory = {
  args: {
    identitySection: (
      <IdentitySectionView
        {...makeIdentitySectionView({ isChromeOn: false })}
      />
    ),
    newsletterSection: (
      <NewsletterSectionView
        {...makeNewsletterSectionView({ isChromeOn: false })}
      />
    ),
    privacySection: (
      <PrivacySection {...makePrivacySection({ isChromeOn: false })} />
    ),
  },
};
