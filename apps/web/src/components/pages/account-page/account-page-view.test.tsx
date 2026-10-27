import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { mockAccountPageView } from '@web/testing/pages/account-page/fixtures';
import { mockIdentitySectionView } from '@web/testing/pages/account-page/identity-section-fixtures';
import { mockNewsletterSectionView } from '@web/testing/pages/account-page/newsletter-section-fixtures';
import { mockPrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import {
  AccountPageView,
  type IAccountPageViewProps,
} from './account-page-view';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth');

const MOCK_VIEW = mockAccountPageView();
const MOCK_IDENTITY_HEADING = mockIdentitySectionView().heading;
const MOCK_NEWSLETTER_HEADING = mockNewsletterSectionView().heading;
const MOCK_PRIVACY_HEADING = mockPrivacySection().heading;

const setup = (overrides?: Partial<IAccountPageViewProps>) =>
  renderElement(
    <ToastProvider>
      <AccountPageView {...mockAccountPageView(overrides)} />
    </ToastProvider>,
  );

describe(`<${AccountPageView.name}/>`, () => {
  it('renders the page heading', () => {
    setup();

    const accountHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_VIEW.heading,
    });

    expect(accountHeading).toBeVisible();
  });

  it('renders all three sections, in identity/newsletter/privacy order', () => {
    setup();

    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    const sectionTitles = sectionHeadings.map((heading) => heading.textContent);

    expect(sectionTitles).toEqual([
      MOCK_IDENTITY_HEADING,
      MOCK_NEWSLETTER_HEADING,
      MOCK_PRIVACY_HEADING,
    ]);
  });

  it('renders no newsletter section when the slot is absent', () => {
    setup({ newsletterSection: undefined });

    const newsletterHeading = screen.queryByRole('heading', {
      level: 2,
      name: MOCK_NEWSLETTER_HEADING,
    });
    const identityHeading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_IDENTITY_HEADING,
    });
    const privacyHeading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_PRIVACY_HEADING,
    });

    expect(newsletterHeading).not.toBeInTheDocument();
    expect(identityHeading).toBeVisible();
    expect(privacyHeading).toBeVisible();
  });
});
