import { customRenderAsync, screen } from '@platform/testing/custom-render';

import SignInErrorPage from './page';

const setup = customRenderAsync(SignInErrorPage, {
  searchParams: Promise.resolve({}),
});

describe(SignInErrorPage, () => {
  it('explains a used or expired sign-in link and offers a new one', async () => {
    await setup({ searchParams: Promise.resolve({ error: 'Verification' }) });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'This sign-in link no longer works',
    });
    const description = screen.getByText(
      'Each sign-in link works once and expires after a while. This one has already been used or has expired. Ask for a new one to sign in.',
    );
    const newLinkLink = screen.getByRole('link', {
      name: 'Get a new sign-in link',
    });

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
    expect(newLinkLink).toHaveAttribute(
      'href',
      '/api/auth/signin?callbackUrl=%2F',
    );
  });

  it.each(['Configuration', 'AccessDenied', undefined])(
    'shows a readable message and a way back to sign-in for the %s error',
    async (error) => {
      await setup({ searchParams: Promise.resolve({ error }) });

      const heading = screen.getByRole('heading', {
        level: 1,
        name: "We couldn't sign you in",
      });
      const description = screen.getByText(
        'Something went wrong while signing you in. Go back to sign-in and try again.',
      );
      const backLink = screen.getByRole('link', { name: 'Back to sign-in' });

      expect(heading).toBeVisible();
      expect(description).toBeVisible();
      expect(backLink).toHaveAttribute(
        'href',
        '/api/auth/signin?callbackUrl=%2F',
      );
    },
  );
});
