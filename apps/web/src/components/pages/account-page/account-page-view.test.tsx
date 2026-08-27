import { customRender, screen } from '@web/testing/custom-render';
import { makeAccountPageView } from '@web/testing/pages/account-page/fixtures';

import { AccountPageView } from './account-page-view';

// `makeAccountPageView`'s default fixture composes the real
// `IdentitySectionView`/`NewsletterSectionView`, imported via their
// section's barrel — which also re-exports the wrapper (`IdentitySection`/
// `NewsletterSection`), so loading it evaluates the wrapper's `auth()`
// import too.
vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@web/components/shared/delete-account-control', () => ({
  DeleteAccountControl: ({ handle }: { handle: string }) => (
    <div data-testid="delete-account-control">{handle}</div>
  ),
}));

const setup = customRender(AccountPageView, makeAccountPageView());

describe(AccountPageView, () => {
  it('renders the page heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account' }),
    ).toBeVisible();
  });

  it('renders all three sections, in identity/newsletter/privacy order', () => {
    setup();

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
