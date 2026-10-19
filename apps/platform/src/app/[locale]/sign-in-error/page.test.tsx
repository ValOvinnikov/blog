import { customRenderAsync, screen } from '@platform/testing/custom-render';

import SignInErrorPage from './page';

const setup = customRenderAsync(SignInErrorPage, {
  searchParams: Promise.resolve({}),
});

describe(SignInErrorPage, () => {
  it('explains a used or expired sign-in link and offers a new one', async () => {
    await setup({ searchParams: Promise.resolve({ error: 'Verification' }) });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'This sign-in link no longer works',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Each sign-in link works once and expires after a while. This one has already been used or has expired. Ask for a new one to sign in.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Get a new sign-in link' }),
    ).toHaveAttribute('href', '/api/auth/signin');
  });

  it.each(['Configuration', 'AccessDenied', undefined])(
    'shows a readable message and a way back to sign-in for the %s error',
    async (error) => {
      await setup({ searchParams: Promise.resolve({ error }) });

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: "We couldn't sign you in",
        }),
      ).toBeVisible();
      expect(
        screen.getByText(
          'Something went wrong while signing you in. Go back to sign-in and try again.',
        ),
      ).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'Back to sign-in' }),
      ).toHaveAttribute('href', '/api/auth/signin');
    },
  );
});
