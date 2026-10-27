import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';

import SignInErrorPage from './page';

const t = makeEnTranslator('signInErrorPage');

const setup = customRenderAsync(SignInErrorPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${SignInErrorPage.name}/>`, () => {
  it('explains a used or expired sign-in link and offers a new one', async () => {
    await setup({ searchParams: Promise.resolve({ error: 'Verification' }) });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('linkSpentHeading'),
    });
    const description = screen.getByText(t('linkSpentDescription'));
    const newLinkLink = screen.getByRole('link', { name: t('requestNewLink') });

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
    expect(newLinkLink).toHaveAttribute('href', MOCK_SIGN_IN_HREF);
  });

  it.each(['Configuration', 'AccessDenied', undefined])(
    'offers a way back to sign-in for the %s error',
    async (error) => {
      await setup({ searchParams: Promise.resolve({ error }) });

      const heading = screen.getByRole('heading', {
        level: 1,
        name: t('heading'),
      });
      const description = screen.getByText(t('description'));
      const backLink = screen.getByRole('link', { name: t('backToSignIn') });

      expect(heading).toBeVisible();
      expect(description).toBeVisible();
      expect(backLink).toHaveAttribute('href', MOCK_SIGN_IN_HREF);
    },
  );
});
