import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';

import PrivacyPage from './page';

const t = makeEnTranslator('legalPlaceholderPage');

const setup = customRenderAsync(PrivacyPage, {});

describe(`<${PrivacyPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('says the page is a placeholder for the final text', () => {
    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('privacyHeading'),
    });
    const description = screen.getByText(t('privacyDescription'));

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
  });

  it('leads back to sign-up', () => {
    const backLink = screen.getByRole('link', { name: t('backToSignUp') });

    expect(backLink).toHaveAttribute('href', adminRoutes.signUp());
  });
});
