import { faker } from '@faker-js/faker';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';

import { HomeDeadEnd } from './home-dead-end';

vi.mock('@platform/server/auth/resolve-home-href', () => ({
  resolveHomeHref: vi.fn(),
}));
vi.mock('@platform/server/auth/get-session-email', () => ({
  getSessionEmail: vi.fn(),
}));

faker.seed(7934);

const t = makeEnTranslator('deadEndView');
const tAccount = makeEnTranslator('account');
const MOCK_PROPS = {
  badge: faker.lorem.word(),
  title: faker.lorem.sentence(),
  description: faker.lorem.sentence(),
};

const setup = customRenderAsync(HomeDeadEnd, MOCK_PROPS);

describe(`<${HomeDeadEnd.name}/>`, () => {
  beforeEach(async () => {
    vi.mocked(resolveHomeHref).mockResolvedValue(adminRoutes.onboarding());
    vi.mocked(getSessionEmail).mockResolvedValue(MOCK_SIGN_IN_EMAIL);
    await setup();
  });

  it('shows the badge, heading and description it is given', () => {
    const badge = screen.getByText(MOCK_PROPS.badge);
    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_PROPS.title,
    });
    const description = screen.getByText(MOCK_PROPS.description);

    expect(badge).toBeVisible();
    expect(heading).toBeVisible();
    expect(description).toBeVisible();
  });

  it('links back to the home the session resolves to', () => {
    const backLink = screen.getByRole('link', { name: t('backHome') });

    expect(backLink).toHaveAttribute('href', adminRoutes.onboarding());
  });

  it('names the signed-in account', () => {
    const account = screen.getByText(
      tAccount('signedInAs', { email: MOCK_SIGN_IN_EMAIL }),
    );

    expect(account).toBeVisible();
  });
});
