import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { mockAccountPageView } from '@web/testing/pages/account-page/fixtures';

import {
  AccountPageView,
  type IAccountPageViewProps,
} from './account-page-view';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

const setup = (overrides?: Partial<IAccountPageViewProps>) =>
  renderElement(
    <ToastProvider>
      <AccountPageView {...mockAccountPageView(overrides)} />
    </ToastProvider>,
  );

describe(`<${AccountPageView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the page heading', () => {
      const accountHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Account',
      });

      expect(accountHeading).toBeVisible();
    });

    it('renders all three sections, in identity/newsletter/privacy order', () => {
      const identityHeading = screen.getByRole('heading', {
        level: 2,
        name: /Connected accounts/,
      });
      const newsletterHeading = screen.getByRole('heading', {
        level: 2,
        name: /Newsletter/,
      });
      const privacyHeading = screen.getByRole('heading', {
        level: 2,
        name: /Privacy/,
      });

      expect(
        identityHeading.compareDocumentPosition(newsletterHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        newsletterHeading.compareDocumentPosition(privacyHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  it('renders no newsletter section when the slot is absent', () => {
    setup({ newsletterSection: undefined });

    const newsletterHeading = screen.queryByRole('heading', {
      level: 2,
      name: /Newsletter/,
    });
    const connectedAccountsHeading = screen.getByRole('heading', {
      level: 2,
      name: /Connected accounts/,
    });
    const privacyHeading = screen.getByRole('heading', {
      level: 2,
      name: /Privacy/,
    });

    expect(newsletterHeading).not.toBeInTheDocument();
    expect(connectedAccountsHeading).toBeVisible();
    expect(privacyHeading).toBeVisible();
  });
});
