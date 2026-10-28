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
import { makeCustomDomainMainAddressAction } from '@platform/server/custom-domain/make-custom-domain-main-address-action';
import { makeSubdomainMainAddressAction } from '@platform/server/custom-domain/make-subdomain-main-address-action';
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
vi.mock(
  '@platform/server/custom-domain/make-custom-domain-main-address-action',
);
vi.mock('@platform/server/custom-domain/make-subdomain-main-address-action');
vi.mock('@platform/server/custom-domain/verify-custom-domain-action');

const { ownDomain } = en.tenantDomainPage;
const POLL_INTERVAL_MS = 10_000;
const CLAIM = mockCustomDomainClaim();
const TITLE = { level: 2, name: ownDomain.title };
const MAIN_TITLE = { level: 2, name: ownDomain.mainTitle };
const { makeMain, useSubdomain } = ownDomain.mainAddress;

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

  describe('a custom main address', () => {
    it('is shown as the main address with no form and no Remove', async () => {
      await renderCard({ isPrimaryCustom: true });
      await screen.findByRole('heading', MAIN_TITLE);

      const remove = screen.queryByRole('button', { name: ownDomain.remove });
      const input = screen.queryByRole('textbox');

      expect(remove).not.toBeInTheDocument();
      expect(input).not.toBeInTheDocument();
    });

    it('offers the way back to the subdomain to an owner', async () => {
      await renderCard({ isPrimaryCustom: true });

      const switchBack = await screen.findByRole('button', {
        name: useSubdomain.trigger,
      });

      expect(switchBack).toBeVisible();
    });

    it('offers the way back to the subdomain on a Free site', async () => {
      await renderCard({
        isPrimaryCustom: true,
        tenant: { ...BASE_PROPS.tenant, plan: TENANT_PLAN.FREE },
      });

      const switchBack = await screen.findByRole('button', {
        name: useSubdomain.trigger,
      });

      expect(switchBack).toBeVisible();
    });

    it('offers no switch to someone who cannot manage the site', async () => {
      await renderCard({ isPrimaryCustom: true, canManage: false });
      await screen.findByRole('heading', MAIN_TITLE);

      const switchBack = screen.queryByRole('button', {
        name: useSubdomain.trigger,
      });

      expect(switchBack).not.toBeInTheDocument();
    });

    it('offers no switch on an archived site', async () => {
      await renderCard({
        isPrimaryCustom: true,
        tenant: { ...BASE_PROPS.tenant, deprovisionedAt: MOCK_ARCHIVED_AT },
      });
      await screen.findByRole('heading', MAIN_TITLE);

      const switchBack = screen.queryByRole('button', {
        name: useSubdomain.trigger,
      });

      expect(switchBack).not.toBeInTheDocument();
    });

    it('switches back after confirmation and moves focus to the new heading', async () => {
      vi.mocked(makeSubdomainMainAddressAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const refresh = mockRouterRefresh();
      const { rerender } = await renderCard({ isPrimaryCustom: true });
      const trigger = await screen.findByRole('button', {
        name: useSubdomain.trigger,
      });
      await user.click(trigger);
      const confirm = await screen.findByRole('button', {
        name: useSubdomain.confirm,
      });
      expect(makeSubdomainMainAddressAction).not.toHaveBeenCalled();

      await user.click(confirm);
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
      expect(makeSubdomainMainAddressAction).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(heading).toHaveFocus();
    });
  });

  describe('a verified custom domain that is not the main address', () => {
    beforeEach(() => {
      vi.mocked(getProjectDomain).mockResolvedValue({
        status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
        dnsRecords: [],
      });
    });

    it('offers Make this the main address to an owner', async () => {
      await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });

      const makeMainButton = await screen.findByRole('button', {
        name: makeMain.trigger,
      });

      expect(makeMainButton).toBeVisible();
    });

    it('offers it to nobody who cannot manage the site', async () => {
      await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN, canManage: false });
      await screen.findByRole('heading', TITLE);

      const makeMainButton = screen.queryByRole('button', {
        name: makeMain.trigger,
      });

      expect(makeMainButton).not.toBeInTheDocument();
    });

    it('offers it on no Free site', async () => {
      await renderCard({
        customDomain: MOCK_CUSTOM_DOMAIN,
        tenant: { ...BASE_PROPS.tenant, plan: TENANT_PLAN.FREE },
      });
      await screen.findByRole('heading', TITLE);

      const makeMainButton = screen.queryByRole('button', {
        name: makeMain.trigger,
      });

      expect(makeMainButton).not.toBeInTheDocument();
    });

    it('makes it the main address after confirmation and moves focus to the new heading', async () => {
      vi.mocked(makeCustomDomainMainAddressAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const refresh = mockRouterRefresh();
      const { rerender } = await renderCard({
        customDomain: MOCK_CUSTOM_DOMAIN,
      });
      const trigger = await screen.findByRole('button', {
        name: makeMain.trigger,
      });
      await user.click(trigger);
      const confirm = await screen.findByRole('button', {
        name: makeMain.confirm,
      });
      expect(makeCustomDomainMainAddressAction).not.toHaveBeenCalled();

      await user.click(confirm);
      await waitFor(() => {
        expect(refresh).toHaveBeenCalledTimes(1);
      });
      await act(async () => {
        rerender(<CustomDomainCard {...BASE_PROPS} isPrimaryCustom={true} />);
      });

      const heading = await screen.findByRole('heading', MAIN_TITLE);
      expect(makeCustomDomainMainAddressAction).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        { domain: MOCK_CUSTOM_DOMAIN },
      );
      expect(heading).toHaveFocus();
    });

    it('shows the refusal in the dialog and does not refresh', async () => {
      vi.mocked(makeCustomDomainMainAddressAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: CUSTOM_DOMAIN_REFUSAL.NOT_VERIFIED,
      });
      const refresh = mockRouterRefresh();
      await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
      const trigger = await screen.findByRole('button', {
        name: makeMain.trigger,
      });
      await user.click(trigger);
      const confirm = await screen.findByRole('button', {
        name: makeMain.confirm,
      });

      await user.click(confirm);

      const message = await screen.findByText(ownDomain.refusal.notVerified);
      expect(message).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  it('offers no way to make a pending custom domain the main address', async () => {
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
    await screen.findByRole('heading', TITLE);

    const makeMainButton = screen.queryByRole('button', {
      name: makeMain.trigger,
    });

    expect(makeMainButton).not.toBeInTheDocument();
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

      const domain = screen.getByText(MOCK_CUSTOM_DOMAIN);
      const txtName = screen.getByText(customDomainTxtName(MOCK_CUSTOM_DOMAIN));
      const token = screen.getByText(MOCK_CLAIM_TOKEN);

      expect(domain).toBeVisible();
      expect(txtName).toBeVisible();
      expect(token).toBeVisible();
    });

    it('offers Verify and Remove to the owner, and no connect form', async () => {
      await renderCard({ claim: CLAIM });
      await screen.findByRole('heading', TITLE);

      const verify = screen.getByRole('button', { name: ownDomain.verify });
      const remove = screen.getByRole('button', { name: ownDomain.remove });
      const textbox = screen.queryByRole('textbox');

      expect(verify).toBeVisible();
      expect(remove).toBeVisible();
      expect(textbox).not.toBeInTheDocument();
    });

    it('shows the claim read-only to someone who cannot manage the site', async () => {
      await renderCard({ claim: CLAIM, canManage: false });
      await screen.findByRole('heading', TITLE);

      const token = screen.getByText(MOCK_CLAIM_TOKEN);
      const verify = screen.queryByRole('button', { name: ownDomain.verify });
      const remove = screen.queryByRole('button', { name: ownDomain.remove });

      expect(token).toBeVisible();
      expect(verify).not.toBeInTheDocument();
      expect(remove).not.toBeInTheDocument();
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

      const refusal = await screen.findByText(
        ownDomain.refusal.connectUnavailable,
      );
      const verifyAgain = await screen.findByRole('button', {
        name: ownDomain.verify,
      });

      expect(refusal).toBeInTheDocument();
      expect(verifyAgain).toBeInTheDocument();
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
