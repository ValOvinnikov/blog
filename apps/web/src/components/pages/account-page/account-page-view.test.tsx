import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { makeAccountPageView } from '@web/testing/pages/account-page/fixtures';

import {
  AccountPageView,
  type IAccountPageViewProps,
} from './account-page-view';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@web/utils/logger/logger');

const setup = (overrides?: Partial<IAccountPageViewProps>) =>
  renderElement(
    <ToastProvider>
      <AccountPageView {...makeAccountPageView(overrides)} />
    </ToastProvider>,
  );

describe(`<${AccountPageView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the page heading', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Account' }),
      ).toBeVisible();
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

    expect(
      screen.queryByRole('heading', { level: 2, name: /Newsletter/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Connected accounts/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: /Privacy/ }),
    ).toBeVisible();
  });
});
