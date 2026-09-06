import { customRenderAsync, screen } from '@web/testing/custom-render';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

const { authMock, privacySectionMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  privacySectionMock: vi.fn(() => (
    <div data-testid="privacy-section">privacy section</div>
  )),
}));

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
  PrivacySection: privacySectionMock,
}));

const setup = customRenderAsync(AccountPage, {});

const authedSession = {
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
};

describe(`<${AccountPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    privacySectionMock.mockClear();
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('renders the page heading and all three sections, in identity/newsletter/privacy order', async () => {
    authMock.mockResolvedValue(authedSession);

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
    expect(
      identitySection.compareDocumentPosition(newsletterSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      newsletterSection.compareDocumentPosition(privacySection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('resolves the session handle into PrivacySection props', async () => {
    authMock.mockResolvedValue(authedSession);

    await setup();

    expect(privacySectionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        handle: 'jane',
        heading: 'Privacy',
        exportLabel: 'Export my data',
        deleteLabel: 'Delete account',
      }),
      undefined,
    );
  });
});
