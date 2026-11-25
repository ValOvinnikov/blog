import {
  NO_ACCESS_REASON,
  type TNoAccessReason,
} from '@platform/constants/no-access';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';

import NoAccessPage from './page';

vi.mock('@platform/server/auth/resolve-home-href', () => ({
  resolveHomeHref: vi.fn(),
}));
vi.mock('@platform/server/auth/get-session-email', () => ({
  getSessionEmail: vi.fn(),
}));

const t = makeEnTranslator('noAccessPage');
const MOCK_UNKNOWN_REASON = 'UNKNOWN';

const setup = customRenderAsync(NoAccessPage, {
  searchParams: Promise.resolve({}),
});

const expectReasonCopy = (reason: TNoAccessReason) => {
  const heading = screen.getByRole('heading', {
    level: 1,
    name: t(`${reason}.heading`),
  });
  const description = screen.getByText(t(`${reason}.description`));

  expect(heading).toBeVisible();
  expect(description).toBeVisible();
};

describe(`<${NoAccessPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(resolveHomeHref).mockResolvedValue(adminRoutes.onboarding());
    vi.mocked(getSessionEmail).mockResolvedValue(MOCK_SIGN_IN_EMAIL);
  });

  it.each(Object.values(NO_ACCESS_REASON))(
    'explains the %s refusal',
    async (reason) => {
      await setup({ searchParams: Promise.resolve({ reason }) });

      expectReasonCopy(reason);
    },
  );

  it.each([undefined, MOCK_UNKNOWN_REASON])(
    'falls back to the plain site refusal for the %s reason',
    async (reason) => {
      await setup({ searchParams: Promise.resolve({ reason }) });

      expectReasonCopy(NO_ACCESS_REASON.SITE);
    },
  );

  it('links back to the home the session resolves to', async () => {
    await setup();

    const backLink = screen.getByRole('link', { name: t('backLink') });

    expect(backLink).toHaveAttribute('href', adminRoutes.onboarding());
  });

  it('never mentions seats', async () => {
    vi.mocked(getSessionEmail).mockResolvedValueOnce(undefined);
    await setup({
      searchParams: Promise.resolve({ reason: NO_ACCESS_REASON.SITE_INVITE }),
    });

    const seatCopy = screen.queryByText(/seat/i);

    expect(seatCopy).not.toBeInTheDocument();
  });
});
