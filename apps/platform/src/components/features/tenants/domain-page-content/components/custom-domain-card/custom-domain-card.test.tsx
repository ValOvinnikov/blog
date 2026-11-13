import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import {
  CUSTOM_DOMAIN_REFUSAL,
  CUSTOM_DOMAIN_TXT_TYPE,
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
import { mockPendingProjectDomain } from '@platform/testing/domains/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockTenant,
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
const SUBDOMAIN_NOTE = makeEnTranslator('tenantDomainPage.ownDomain')(
  'subdomainStillWorks',
  { subdomain: MOCK_TENANT_DOMAIN },
);

const tDomainPage = makeEnTranslator('tenantDomainPage');
const COPY_TXT_NAME = tDomainPage('copyRecordName', {
  type: CUSTOM_DOMAIN_TXT_TYPE,
});
const COPY_TXT_VALUE = tDomainPage('copyRecordValue', {
  type: CUSTOM_DOMAIN_TXT_TYPE,
});

const siteOn = (overrides: Parameters<typeof mockTenant>[0] = {}) =>
  mockTenant({
    plan: TENANT_PLAN.GROWTH,
    primaryDomain: MOCK_TENANT_DOMAIN,
    ...overrides,
  });

const BASE_PROPS: TCustomDomainCardProps = {
  tenant: siteOn(),
  customDomain: undefined,
  subdomain: MOCK_TENANT_DOMAIN,
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
  let refresh: ReturnType<typeof mockRouterRefresh>;
  let rendered: Awaited<ReturnType<typeof renderCard>>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(getCustomDomainStatusAction).mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );
    vi.mocked(getProjectDomain).mockResolvedValue(mockPendingProjectDomain());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderCard = (props: Partial<TCustomDomainCardProps>) =>
    act(async () => setup(props));

  const pollOnce = async () => {
    await screen.findByRole('heading', TITLE);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
  };

  const openConfirm = async (triggerName: string, confirmName: string) => {
    const trigger = await screen.findByRole('button', { name: triggerName });
    await user.click(trigger);
    return screen.findByRole('button', { name: confirmName });
  };

  const rerenderAfterRefresh = async (
    props: Partial<TCustomDomainCardProps>,
  ) => {
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      rendered.rerender(<CustomDomainCard {...BASE_PROPS} {...props} />);
    });
  };

  const confirmVia = async (triggerName: string, confirmName: string) => {
    const confirm = await openConfirm(triggerName, confirmName);
    await user.click(confirm);
  };

  const expectNoButton = async (heading: typeof TITLE, name: string) => {
    await screen.findByRole('heading', heading);
    const button = screen.queryByRole('button', { name });
    expect(button).not.toBeInTheDocument();
  };

  const expectSwitchBackVisible = async () => {
    const switchBack = await screen.findByRole('button', {
      name: useSubdomain.trigger,
    });
    expect(switchBack).toBeVisible();
  };

  const expectHeadingFocused = async (heading: typeof TITLE) => {
    const headingElement = await screen.findByRole('heading', heading);
    expect(headingElement).toHaveFocus();
  };

  const expectFocusAfterRefresh = async (
    props: Partial<TCustomDomainCardProps>,
  ) => {
    await rerenderAfterRefresh(props);
    await expectHeadingFocused(TITLE);
  };

  const pressVerify = async () => {
    const verify = await screen.findByRole('button', {
      name: ownDomain.verify,
    });
    await user.click(verify);
  };

  describe('polling a connected custom domain', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    });

    it('polls the custom domain of a live site', async () => {
      await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });

      await pollOnce();

      expect(getCustomDomainStatusAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('does not poll the custom domain of an archived site', async () => {
      await renderCard({
        customDomain: MOCK_CUSTOM_DOMAIN,
        tenant: siteOn({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      });

      await pollOnce();

      expect(getCustomDomainStatusAction).not.toHaveBeenCalled();
    });
  });

  it('offers Remove only to someone who can manage the site', async () => {
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN, canManage: false });

    await expectNoButton(TITLE, ownDomain.remove);
  });

  describe('a pending custom domain shown to an owner', () => {
    beforeEach(async () => {
      rendered = await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
    });

    it('offers no way to make it the main address', async () => {
      await expectNoButton(TITLE, makeMain.trigger);
    });

    it('moves focus to the new card heading after a successful remove', async () => {
      vi.mocked(removeCustomDomainAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });

      await confirmVia(ownDomain.remove, ownDomain.removeConfirm);
      await expectFocusAfterRefresh({});
    });
  });

  describe('a custom main address', () => {
    describe('seen by its owner', () => {
      beforeEach(async () => {
        rendered = await renderCard({ isPrimaryCustom: true });
      });

      it('is shown as the main address with no form and no Remove', async () => {
        await expectNoButton(MAIN_TITLE, ownDomain.remove);
        const input = screen.queryByRole('textbox');

        expect(input).not.toBeInTheDocument();
      });

      it('names the subdomain and says it still works', async () => {
        const note = await screen.findByText(SUBDOMAIN_NOTE);

        expect(note).toBeVisible();
      });

      it('offers the way back to the subdomain', async () => {
        await expectSwitchBackVisible();
      });

      it('switches back after confirmation and moves focus to the new heading', async () => {
        vi.mocked(makeSubdomainMainAddressAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
        });
        const confirm = await openConfirm(
          useSubdomain.trigger,
          useSubdomain.confirm,
        );
        expect(makeSubdomainMainAddressAction).not.toHaveBeenCalled();

        await user.click(confirm);
        await rerenderAfterRefresh({ customDomain: MOCK_CUSTOM_DOMAIN });

        expect(makeSubdomainMainAddressAction).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
        await expectHeadingFocused(TITLE);
      });
    });

    it('offers the way back to the subdomain on a Free site', async () => {
      await renderCard({
        isPrimaryCustom: true,
        tenant: siteOn({ plan: TENANT_PLAN.FREE }),
      });

      await expectSwitchBackVisible();
    });

    it.each([
      {
        scenario: 'to someone who cannot manage the site',
        props: { canManage: false },
      },
      {
        scenario: 'on an archived site',
        props: {
          tenant: siteOn({ deprovisionedAt: MOCK_ARCHIVED_AT }),
        },
      },
    ])('offers no switch $scenario', async ({ props }) => {
      await renderCard({ isPrimaryCustom: true, ...props });

      await expectNoButton(MAIN_TITLE, useSubdomain.trigger);
    });
  });

  describe('a verified custom domain that is not the main address', () => {
    beforeEach(() => {
      vi.mocked(getProjectDomain).mockResolvedValue({
        status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
        dnsRecords: [],
      });
    });

    describe('offered to an owner', () => {
      beforeEach(async () => {
        rendered = await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
      });

      it('offers Make this the main address', async () => {
        const makeMainButton = await screen.findByRole('button', {
          name: makeMain.trigger,
        });

        expect(makeMainButton).toBeVisible();
      });

      it('does not say the subdomain still works', async () => {
        await screen.findByRole('heading', TITLE);

        const note = screen.queryByText(SUBDOMAIN_NOTE);

        expect(note).not.toBeInTheDocument();
      });

      it('makes it the main address after confirmation and moves focus to the new heading', async () => {
        vi.mocked(makeCustomDomainMainAddressAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
        });
        const confirm = await openConfirm(makeMain.trigger, makeMain.confirm);
        expect(makeCustomDomainMainAddressAction).not.toHaveBeenCalled();

        await user.click(confirm);
        await rerenderAfterRefresh({ isPrimaryCustom: true });

        expect(makeCustomDomainMainAddressAction).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          { domain: MOCK_CUSTOM_DOMAIN },
        );
        await expectHeadingFocused(MAIN_TITLE);
      });

      it('shows the refusal in the dialog and does not refresh', async () => {
        vi.mocked(makeCustomDomainMainAddressAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.REFUSED,
          reason: CUSTOM_DOMAIN_REFUSAL.NOT_VERIFIED,
        });

        await confirmVia(makeMain.trigger, makeMain.confirm);

        const message = await screen.findByText(ownDomain.refusal.notVerified);
        expect(message).toBeVisible();
        expect(refresh).not.toHaveBeenCalled();
      });
    });

    it('offers it on a Starter site', async () => {
      await renderCard({
        customDomain: MOCK_CUSTOM_DOMAIN,
        tenant: siteOn({ plan: TENANT_PLAN.STARTER }),
      });

      const makeMainButton = await screen.findByRole('button', {
        name: makeMain.trigger,
      });

      expect(makeMainButton).toBeVisible();
    });

    it.each([
      {
        scenario: 'nobody who cannot manage the site',
        props: { canManage: false },
      },
      {
        scenario: 'no Free site',
        props: { tenant: siteOn({ plan: TENANT_PLAN.FREE }) },
      },
    ])('offers it to $scenario', async ({ props }) => {
      await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN, ...props });

      await expectNoButton(TITLE, makeMain.trigger);
    });
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
    rendered = await renderCard({});
    const domainField = screen.getByRole('textbox', {
      name: ownDomain.domainLabel,
    });
    const connectButton = screen.getByRole('button', {
      name: ownDomain.connect,
    });

    await user.type(domainField, MOCK_CUSTOM_DOMAIN);
    await user.click(connectButton);
    await expectFocusAfterRefresh({ customDomain: MOCK_CUSTOM_DOMAIN });
  });

  describe('awaiting proof', () => {
    beforeEach(() => {
      vi.mocked(verifyCustomDomainAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND,
      });
    });

    describe('claimed by an owner', () => {
      beforeEach(async () => {
        rendered = await renderCard({ claim: CLAIM });
        await screen.findByRole('heading', TITLE);
      });

      it('shows the domain and the TXT record to add', () => {
        const domain = screen.getByText(MOCK_CUSTOM_DOMAIN);
        const txtName = screen.getByText(
          customDomainTxtName(MOCK_CUSTOM_DOMAIN),
        );
        const token = screen.getByText(MOCK_CLAIM_TOKEN);

        expect(domain).toBeVisible();
        expect(txtName).toBeVisible();
        expect(token).toBeVisible();
      });

      it('offers Verify and Remove, and no connect form', () => {
        const verify = screen.getByRole('button', { name: ownDomain.verify });
        const remove = screen.getByRole('button', { name: ownDomain.remove });
        const textbox = screen.queryByRole('textbox');

        expect(verify).toBeVisible();
        expect(remove).toBeVisible();
        expect(textbox).not.toBeInTheDocument();
      });

      it('verifies the site when the owner presses Verify', async () => {
        await pressVerify();

        expect(verifyCustomDomainAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
      });

      it('moves focus to the new card heading after a successful verify', async () => {
        vi.mocked(verifyCustomDomainAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
        });

        await pressVerify();
        await expectFocusAfterRefresh({ customDomain: MOCK_CUSTOM_DOMAIN });
      });

      it("shows the worker's reason and keeps Verify after a rejected connect", async () => {
        vi.mocked(verifyCustomDomainAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.REFUSED,
          reason: CUSTOM_DOMAIN_REFUSAL.CONNECT_UNAVAILABLE,
        });

        await pressVerify();

        const refusal = await screen.findByText(
          ownDomain.refusal.connectUnavailable,
        );
        const verifyAgain = await screen.findByRole('button', {
          name: ownDomain.verify,
        });

        expect(refusal).toBeInTheDocument();
        expect(verifyAgain).toBeInTheDocument();
      });
    });

    describe('shown to someone who cannot manage the site', () => {
      beforeEach(async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        await renderCard({ claim: CLAIM, canManage: false });
        await screen.findByRole('heading', TITLE);
      });

      it('shows the claim read-only', () => {
        const token = screen.getByText(MOCK_CLAIM_TOKEN);
        const verify = screen.queryByRole('button', { name: ownDomain.verify });
        const remove = screen.queryByRole('button', { name: ownDomain.remove });

        expect(token).toBeVisible();
        expect(verify).not.toBeInTheDocument();
        expect(remove).not.toBeInTheDocument();
      });

      it.each([
        [COPY_TXT_NAME, customDomainTxtName(MOCK_CUSTOM_DOMAIN)],
        [COPY_TXT_VALUE, MOCK_CLAIM_TOKEN],
      ])('copies exactly the record text with %s', async (name, expected) => {
        const button = screen.getByRole('button', { name });
        await user.click(button);
        const clipboard = await navigator.clipboard.readText();

        expect(clipboard).toBe(expected);
      });

      it('does not poll', async () => {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(
            CUSTOM_DOMAIN_VERIFY_POLL.intervalMs * 3,
          );
        });

        expect(verifyCustomDomainAction).not.toHaveBeenCalled();
      });
    });
  });
});
