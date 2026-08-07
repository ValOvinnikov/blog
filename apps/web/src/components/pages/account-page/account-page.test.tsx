import { customRenderAsync, screen } from '@web/testing/custom-render';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/components/pages/account-page/sections/identity-section', () => ({
  IdentitySection: () => (
    <div data-testid="identity-section">identity section</div>
  ),
}));

vi.mock(
  '@web/components/pages/account-page/sections/newsletter-section',
  () => ({
    NewsletterSection: () => (
      <div data-testid="newsletter-section">newsletter section</div>
    ),
  }),
);

vi.mock('@web/components/pages/account-page/sections/privacy-section', () => ({
  PrivacySection: () => (
    <div data-testid="privacy-section">privacy section</div>
  ),
}));

const setup = customRenderAsync(AccountPage, {});

describe(`<${AccountPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('renders the page heading and all three sections, in 6c/6b/6a order', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Val Ovinnikov', email: 'val@example.com' },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account' }),
    ).toBeVisible();

    const identitySection = screen.getByTestId('identity-section');
    const newsletterSection = screen.getByTestId('newsletter-section');
    const privacySection = screen.getByTestId('privacy-section');
    expect(identitySection).toBeVisible();
    expect(newsletterSection).toBeVisible();
    expect(privacySection).toBeVisible();
    // #1158/#1162's page-ordering decision: 6c "connected accounts" renders
    // first, then 6b "email & newsletter preferences", then 6a "privacy &
    // data" last — each must precede the next in document order.
    expect(
      identitySection.compareDocumentPosition(newsletterSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      newsletterSection.compareDocumentPosition(privacySection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
