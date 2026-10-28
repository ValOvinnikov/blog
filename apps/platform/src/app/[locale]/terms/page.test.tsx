import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';

import TermsPage from './page';

const t = makeEnTranslator('legalPlaceholderPage');

const setup = customRenderAsync(TermsPage, {});

describe(`<${TermsPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('says the page is a placeholder for the final text', () => {
    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('termsHeading'),
    });
    const description = screen.getByText(t('termsDescription'));

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
  });

  it('leads back to sign-up', () => {
    const backLink = screen.getByRole('link', { name: t('backToSignUp') });

    expect(backLink).toHaveAttribute('href', adminRoutes.signUp());
  });
});
