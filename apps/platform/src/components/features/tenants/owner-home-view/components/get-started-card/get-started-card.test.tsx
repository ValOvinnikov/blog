import { GET_STARTED_STEP } from '@platform/constants/get-started';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import type { TGetStarted } from '@platform/server/onboarding/get-started-for';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_URL,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { GetStartedCard } from './get-started-card';

vi.mock('@platform/server/owner-access/check-owner-access-action', () => ({
  checkOwnerAccessAction: vi.fn(),
}));

vi.mock('@platform/server/owner-access/resend-owner-invite-action', () => ({
  resendOwnerInviteAction: vi.fn(),
}));

const MOCK_NONE_DONE = {
  [GET_STARTED_STEP.LOOK]: false,
  [GET_STARTED_STEP.VOICE]: false,
  [GET_STARTED_STEP.EDITOR_INVITE]: false,
  [GET_STARTED_STEP.FIRST_POST]: false,
};

const MOCK_GET_STARTED: TGetStarted = {
  tenantId: MOCK_TENANT_ID,
  siteAddress: MOCK_TENANT_DOMAIN,
  doneSteps: MOCK_NONE_DONE,
  studioAccess: OWNER_STUDIO_ACCESS.INVITE_SENT,
};

const renderCard = customRender(GetStartedCard, {
  getStarted: MOCK_GET_STARTED,
});

const setup = (overrides: Partial<TGetStarted> = {}) =>
  renderCard({ getStarted: { ...MOCK_GET_STARTED, ...overrides } });

const OPEN_STUDIO = { name: 'Open Studio' };
const CHECK_NOW = { name: 'Check now' };

describe(`<${GetStartedCard.name}/>`, () => {
  describe('just provisioned', () => {
    beforeEach(() => {
      setup();
    });

    it('leads with the live site, its address and a link to it', () => {
      const address = screen.getByText(MOCK_TENANT_DOMAIN);
      const openSite = screen.getByRole('link', { name: /Open site/ });
      const copy = screen.getByRole('button', { name: 'Copy address' });

      expect(address).toBeVisible();
      expect(openSite).toHaveAttribute('href', MOCK_TENANT_URL);
      expect(copy).toBeVisible();
    });

    it('counts no step done', () => {
      const count = screen.getByText('0 of 4 done');

      expect(count).toBeVisible();
    });

    it('lists the four steps, each announced as not done', () => {
      const items = within(screen.getByRole('list')).getAllByRole('listitem');

      expect(items.map((item) => item.textContent)).toEqual([
        expect.stringContaining('Pick a look: not done'),
        expect.stringContaining('Set your voice: not done'),
        expect.stringContaining('Accept your editor invite: not done'),
        expect.stringContaining('Write your first post: not done'),
      ]);
    });

    it('links to Look and Voice', () => {
      const look = screen.getByRole('link', { name: 'Open Look' });
      const voice = screen.getByRole('link', { name: 'Open Voice' });

      expect(look).toHaveAttribute('href', adminRoutes.dashboardLook());
      expect(voice).toHaveAttribute('href', adminRoutes.dashboardVoice());
    });

    it('shows the invite state with its actions and keeps the Studio closed', () => {
      const pill = screen.getByText('Invite sent — check your email');
      const checkNow = screen.getByRole('button', CHECK_NOW);
      const openStudio = screen.queryByRole('link', OPEN_STUDIO);
      const locked = screen.getByText(
        'Opens once your editor invite is accepted',
      );

      expect(pill).toBeVisible();
      expect(checkNow).toBeVisible();
      expect(openStudio).not.toBeInTheDocument();
      expect(locked).toBeVisible();
    });
  });

  it.each([
    [OWNER_STUDIO_ACCESS.ACTIVATING, 'Setting up…'],
    [OWNER_STUDIO_ACCESS.STALLED, 'Needs attention'],
  ])('shows the %s invite state', (studioAccess, pillText) => {
    setup({ studioAccess });

    const pill = screen.getByText(pillText);
    const checkNow = screen.getByRole('button', CHECK_NOW);

    expect(pill).toBeVisible();
    expect(checkNow).toBeVisible();
  });

  it('says the Studio is being set up once the invite is accepted', () => {
    setup({
      doneSteps: { ...MOCK_NONE_DONE, [GET_STARTED_STEP.EDITOR_INVITE]: true },
      studioAccess: OWNER_STUDIO_ACCESS.ACTIVATING,
    });

    const activating = screen.getByText(
      'Opens once your editor access is set up, usually within a minute',
    );
    const openStudio = screen.queryByRole('link', OPEN_STUDIO);

    expect(activating).toBeVisible();
    expect(openStudio).not.toBeInTheDocument();
  });

  it('opens the Studio once the editor is ready', () => {
    setup({
      doneSteps: { ...MOCK_NONE_DONE, [GET_STARTED_STEP.EDITOR_INVITE]: true },
      studioAccess: OWNER_STUDIO_ACCESS.READY,
    });

    const openStudio = screen.getByRole('link', OPEN_STUDIO);
    const checkNow = screen.queryByRole('button', CHECK_NOW);

    expect(openStudio).toHaveAttribute('href', adminRoutes.dashboardStudio());
    expect(checkNow).not.toBeInTheDocument();
  });

  it('shows a done step as its title only, announced as done', () => {
    setup({
      doneSteps: {
        ...MOCK_NONE_DONE,
        [GET_STARTED_STEP.LOOK]: true,
        [GET_STARTED_STEP.VOICE]: true,
        [GET_STARTED_STEP.EDITOR_INVITE]: true,
      },
      studioAccess: OWNER_STUDIO_ACCESS.READY,
    });

    const count = screen.getByText('3 of 4 done');
    const lookDone = screen.getByText('Pick a look: done');
    const openLook = screen.queryByRole('link', { name: 'Open Look' });

    expect(count).toBeVisible();
    expect(lookDone).toBeInTheDocument();
    expect(openLook).not.toBeInTheDocument();
  });
});
