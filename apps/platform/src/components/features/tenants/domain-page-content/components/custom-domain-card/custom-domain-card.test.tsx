import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import {
  CUSTOM_DOMAIN_REFUSAL,
  CUSTOM_DOMAIN_VERIFY_POLL,
} from '@platform/constants/custom-domain';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { connectCustomDomainAction } from '@platform/server/custom-domain/connect-custom-domain-action';
import { getCustomDomainStatusAction } from '@platform/server/custom-domain/get-custom-domain-status-action';
import { removeCustomDomainAction } from '@platform/server/custom-domain/remove-custom-domain-action';
import { verifyCustomDomainAction } from '@platform/server/custom-domain/verify-custom-domain-action';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import {
  MOCK_CLAIM_TOKEN,
  mockCustomDomainClaim,
} from '@platform/testing/custom-domain/fixtures';
import {
  act,
  customRender,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_VERCEL_A_RECORD,
} from '@platform/testing/tenants/fixtures';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  CustomDomainCard,
  type TCustomDomainCardProps,
} from './custom-domain-card';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

vi.mock('@platform/server/custom-domain/get-custom-domain-status-action');
vi.mock('@platform/server/custom-domain/connect-custom-domain-action');
vi.mock('@platform/server/custom-domain/remove-custom-domain-action');
vi.mock('@platform/server/custom-domain/verify-custom-domain-action');

const { ownDomain } = en.tenantDomainPage;
const POLL_INTERVAL_MS = 10_000;
const CLAIM = mockCustomDomainClaim();
const TITLE = { level: 2, name: ownDomain.title };

const BASE_PROPS: TCustomDomainCardProps = {
  tenant: {
    id: MOCK_TENANT_ID,
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: null,
    primaryDomain: MOCK_TENANT_DOMAIN,
  },
  customDomain: undefined,
  claim: undefined,
  isPrimaryCustom: false,
  primaryProjectDomain: Promise.resolve({
    status: DOMAIN_VERIFICATION_STATUS.PENDING,
    dnsRecords: [],
  }),
  canManage: true,
};

const setup = customRender(CustomDomainCard, BASE_PROPS);

describe(`<${CustomDomainCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(getCustomDomainStatusAction).mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );
    vi.mocked(getProjectDomain).mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderCard = (props: Partial<TCustomDomainCardProps>) =>
    act(async () => setup(props));

  const pollOnce = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
  };

  it('polls the custom domain of a live site', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
    await screen.findByRole('heading', TITLE);

    await pollOnce();

    expect(getCustomDomainStatusAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('does not poll the custom domain of an archived site', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await renderCard({
      customDomain: MOCK_CUSTOM_DOMAIN,
      tenant: { ...BASE_PROPS.tenant, deprovisionedAt: MOCK_ARCHIVED_AT },
    });
    await screen.findByRole('heading', TITLE);

    await pollOnce();

    expect(getCustomDomainStatusAction).not.toHaveBeenCalled();
  });

  it('offers Remove only to someone who can manage the site', async () => {
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN, canManage: false });
    await screen.findByRole('heading', TITLE);

    const remove = screen.queryByRole('button', { name: ownDomain.remove });

    expect(remove).not.toBeInTheDocument();
  });

  it('shows a custom main address read-only, with no form and no Remove', async () => {
    await renderCard({ isPrimaryCustom: true });
    await screen.findByRole('heading', TITLE);

    const remove = screen.queryByRole('button', { name: ownDomain.remove });
    const input = screen.queryByRole('textbox');

    expect(remove).not.toBeInTheDocument();
    expect(input).not.toBeInTheDocument();
  });

  it('tells a member who cannot manage the site that only the owner can connect', () => {
    setup({ canManage: false });

    const message = screen.getByText(ownDomain.ownerOnly);
    const input = screen.queryByRole('textbox');

    expect(message).toBeVisible();
    expect(input).not.toBeInTheDocument();
  });

  it('moves focus to the new card heading after a successful connect', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    const refresh = mockRouterRefresh();
    const { rerender } = await renderCard({});
    const domainField = screen.getByRole('textbox', {
      name: ownDomain.domainLabel,
    });
    const connectButton = screen.getByRole('button', {
      name: ownDomain.connect,
    });

    await user.type(domainField, MOCK_CUSTOM_DOMAIN);
    await user.click(connectButton);
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      rerender(
        <CustomDomainCard {...BASE_PROPS} customDomain={MOCK_CUSTOM_DOMAIN} />,
      );
    });

    const heading = await screen.findByRole('heading', TITLE);
    expect(heading).toHaveFocus();
  });

  it('moves focus to the new card heading after a successful remove', async () => {
    vi.mocked(removeCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    const refresh = mockRouterRefresh();
    const { rerender } = await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
    const removeButton = await screen.findByRole('button', {
      name: ownDomain.remove,
    });
    await user.click(removeButton);
    const confirmButton = await screen.findByRole('button', {
      name: ownDomain.removeConfirm,
    });

    await user.click(confirmButton);
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      rerender(<CustomDomainCard {...BASE_PROPS} />);
    });

    const heading = await screen.findByRole('heading', TITLE);
    expect(heading).toHaveFocus();
  });

  describe('awaiting proof', () => {
    beforeEach(() => {
      vi.mocked(verifyCustomDomainAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND,
      });
    });

    it('shows the domain and the TXT record to add', async () => {
      await renderCard({ claim: CLAIM });
      await screen.findByRole('heading', TITLE);

      expect(screen.getByText(MOCK_CUSTOM_DOMAIN)).toBeVisible();
      expect(
        screen.getByText(customDomainTxtName(MOCK_CUSTOM_DOMAIN)),
      ).toBeVisible();
      expect(screen.getByText(MOCK_CLAIM_TOKEN)).toBeVisible();
    });

    it('offers Verify and Remove to the owner, and no connect form', async () => {
      await renderCard({ claim: CLAIM });
      await screen.findByRole('heading', TITLE);

      expect(
        screen.getByRole('button', { name: ownDomain.verify }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: ownDomain.remove }),
      ).toBeVisible();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows the claim read-only to someone who cannot manage the site', async () => {
      await renderCard({ claim: CLAIM, canManage: false });
      await screen.findByRole('heading', TITLE);

      expect(screen.getByText(MOCK_CLAIM_TOKEN)).toBeVisible();
      expect(
        screen.queryByRole('button', { name: ownDomain.verify }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: ownDomain.remove }),
      ).not.toBeInTheDocument();
    });

    it('verifies the site when the owner presses Verify', async () => {
      await renderCard({ claim: CLAIM });
      const verify = await screen.findByRole('button', {
        name: ownDomain.verify,
      });

      await user.click(verify);

      expect(verifyCustomDomainAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('moves focus to the new card heading after a successful verify', async () => {
      vi.mocked(verifyCustomDomainAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const refresh = mockRouterRefresh();
      const { rerender } = await renderCard({ claim: CLAIM });
      const verify = await screen.findByRole('button', {
        name: ownDomain.verify,
      });

      await user.click(verify);
      await waitFor(() => {
        expect(refresh).toHaveBeenCalledTimes(1);
      });
      await act(async () => {
        rerender(
          <CustomDomainCard
            {...BASE_PROPS}
            customDomain={MOCK_CUSTOM_DOMAIN}
          />,
        );
      });

      const heading = await screen.findByRole('heading', TITLE);
      expect(heading).toHaveFocus();
    });

    it("shows the worker's reason and keeps Verify after a rejected connect", async () => {
      vi.mocked(verifyCustomDomainAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: CUSTOM_DOMAIN_REFUSAL.CONNECT_UNAVAILABLE,
      });
      await renderCard({ claim: CLAIM });
      const verify = await screen.findByRole('button', {
        name: ownDomain.verify,
      });

      await user.click(verify);

      expect(
        await screen.findByText(ownDomain.refusal.connectUnavailable),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: ownDomain.verify }),
      ).toBeInTheDocument();
    });

    it('does not poll for someone who cannot manage the site', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      await renderCard({ claim: CLAIM, canManage: false });
      await screen.findByRole('heading', TITLE);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          CUSTOM_DOMAIN_VERIFY_POLL.intervalMs * 3,
        );
      });

      expect(verifyCustomDomainAction).not.toHaveBeenCalled();
    });
  });
});
