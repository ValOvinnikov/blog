import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SignUpPage from './page';

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/accept-signup-terms-action', () => ({
  acceptSignupTermsAction: vi.fn(),
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const tPage = makeEnTranslator('signUpPage');
const tForm = makeEnTranslator('signUpForm');

const setup = customRenderAsync(SignUpPage, {});

describe(`<${SignUpPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue(null);
  });

  it('shows a signed-out visitor the sign-up form', async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: tPage('heading'),
    });
    const continueButton = screen.getByRole('button', {
      name: tForm('continue'),
    });

    expect(heading).toBeVisible();
    expect(continueButton).toBeVisible();
  });

  it('sends a signed-in user home', async () => {
    authMock.mockResolvedValueOnce({ user: { id: MOCK_SIGN_IN_USER_ID } });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.home());
  });
});
