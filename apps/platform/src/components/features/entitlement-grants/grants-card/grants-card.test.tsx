import {
  ENTITLEMENT_GRANT_REFUSAL,
  GRANT_STATUS,
} from '@platform/constants/entitlement-grant';
import en from '@platform/i18n/messages/en.json';
import { revokeEntitlementGrantAction } from '@platform/server/entitlement-grants/revoke-entitlement-grant-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_GRANT_ID,
  MOCK_GRANT_NOTE,
  MOCK_GRANTED_BY_EMAIL,
  MOCK_TENANT_CREATED_AT,
  mockGrantRow,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { formatDate } from '@platform/utils/format-date/format-date';
import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@shinefold/config';
import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { DAY_MS, ENTITLEMENT_KIND } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GrantsCard } from './grants-card';

vi.mock('@platform/server/entitlement-grants/revoke-entitlement-grant-action');

const { grantsCard, grantModulePack, revokeGrantControl, featuresSettings } =
  en;
const t = makeEnTranslator('grantsCard');
const tRevoke = makeEnTranslator('revokeGrantControl');
const READER_ACCOUNTS =
  featuresSettings.toggleLabel[CAPABILITY.READER_ACCOUNTS];
const TARGET = mockGrantTarget({ plan: TENANT_PLAN.STARTER });
const GRANTED_ON = formatDate(MOCK_TENANT_CREATED_AT, LOCALE_ISO_CODES.EN);
const ENDS_AT = new Date(MOCK_TENANT_CREATED_AT.getTime() + 30 * DAY_MS);
const ENDS_ON = formatDate(ENDS_AT, LOCALE_ISO_CODES.EN);
const VALUES = { item: READER_ACCOUNTS, tenant: TARGET.tenantName };
const READER_ACCOUNTS_GRANT = mockGrantRow({ key: CAPABILITY.READER_ACCOUNTS });
const REVOKE_TRIGGER = { name: tRevoke('revoke.triggerAriaLabel', VALUES) };
const removeTrigger = (item: string) => ({
  name: tRevoke('remove.triggerAriaLabel', { item }),
});

const setup = customRender(GrantsCard, {
  grants: [READER_ACCOUNTS_GRANT],
  target: TARGET,
});

describe(`<${GrantsCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  describe('with no grants', () => {
    it('keeps the card and says everything comes from the plan', () => {
      setup({ grants: [] });

      const heading = screen.getByRole('heading', { name: grantsCard.title });
      const supportingText = screen.getByText(grantsCard.supportingText);
      const empty = screen.getByText(grantsCard.empty);

      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
      expect(empty).toBeVisible();
    });
  });

  describe('a grant that never expires', () => {
    beforeEach(() => {
      setup({
        grants: [{ ...READER_ACCOUNTS_GRANT, note: MOCK_GRANT_NOTE }],
      });
    });

    it('shows the item with a neutral kind badge', () => {
      const item = screen.getByText(READER_ACCOUNTS);
      const kind = screen.getByText(grantsCard.kind.CAPABILITY);

      expect(item).toBeVisible();
      expect(kind).toBeVisible();
    });

    it('shows who granted it, when, and that it lasts until revoked', () => {
      const meta = screen.getByText(
        t('metaUntilRevoked', { who: MOCK_GRANTED_BY_EMAIL, date: GRANTED_ON }),
      );

      expect(meta).toBeVisible();
    });

    it('shows the note', () => {
      const note = screen.getByText(MOCK_GRANT_NOTE);

      expect(note).toBeVisible();
    });
  });

  it('shows when a grant that expires ends', () => {
    setup({ grants: [{ ...READER_ACCOUNTS_GRANT, expiresAt: ENDS_AT }] });

    const meta = screen.getByText(
      t('metaExpires', {
        who: MOCK_GRANTED_BY_EMAIL,
        date: GRANTED_ON,
        expiry: ENDS_ON,
      }),
    );

    expect(meta).toBeVisible();
  });

  it('names a language grant by how many languages it adds', () => {
    setup({
      grants: [
        mockGrantRow({
          kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
          key: ENTITLEMENT_KIND.LOCALE_LIMIT,
          value: 4,
        }),
      ],
    });

    const item = screen.getByText(
      makeEnTranslator('grantItemNames')('languages', { count: 3 }),
    );
    const kind = screen.getByText(grantsCard.kind.LOCALE_LIMIT);

    expect(item).toBeVisible();
    expect(kind).toBeVisible();
  });

  it('keeps an expired grant, badged and with its end date', () => {
    setup({
      grants: [
        {
          ...READER_ACCOUNTS_GRANT,
          status: GRANT_STATUS.EXPIRED,
          expiresAt: ENDS_AT,
        },
      ],
    });

    const expired = screen.getByText(grantsCard.expired);
    const meta = screen.getByText(
      t('metaExpired', {
        who: MOCK_GRANTED_BY_EMAIL,
        date: GRANTED_ON,
        expiry: ENDS_ON,
      }),
    );

    expect(expired).toBeVisible();
    expect(meta).toBeVisible();
  });

  it('keeps a grant the plan now covers, badged as included', () => {
    setup({
      grants: [{ ...READER_ACCOUNTS_GRANT, status: GRANT_STATUS.INCLUDED }],
    });

    const included = screen.getByText(grantsCard.included);

    expect(included).toBeVisible();
  });

  describe('for a super admin', () => {
    it('offers to grant a module pack from the header', () => {
      setup();

      const grantPack = screen.getByRole('button', {
        name: grantModulePack.trigger,
      });

      expect(grantPack).toBeVisible();
    });

    it('offers a revoke on an active grant and a remove on an expired one', () => {
      setup({
        grants: [
          READER_ACCOUNTS_GRANT,
          mockGrantRow({
            id: `${MOCK_GRANT_ID}-expired`,
            key: CAPABILITY.BOOKMARKS,
            status: GRANT_STATUS.EXPIRED,
            expiresAt: ENDS_AT,
          }),
        ],
      });

      const revoke = screen.getByRole('button', REVOKE_TRIGGER);
      const remove = screen.getByRole(
        'button',
        removeTrigger(featuresSettings.toggleLabel[CAPABILITY.BOOKMARKS]),
      );

      expect(revoke).toHaveTextContent(revokeGrantControl.revoke.trigger);
      expect(remove).toHaveTextContent(revokeGrantControl.remove.trigger);
    });
  });

  describe('for an operator who cannot grant', () => {
    beforeEach(() => {
      setup({ target: undefined });
    });

    it('shows the grants without revoke or module pack actions', () => {
      const item = screen.getByText(READER_ACCOUNTS);
      const grantPack = screen.queryByRole('button', {
        name: grantModulePack.trigger,
      });
      const revoke = screen.queryByRole('button', {
        name: revokeGrantControl.revoke.trigger,
      });

      expect(item).toBeVisible();
      expect(grantPack).not.toBeInTheDocument();
      expect(revoke).not.toBeInTheDocument();
    });
  });

  describe('with the revoke dialog open', () => {
    let revokeButton: HTMLElement;

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', REVOKE_TRIGGER);
      await user.click(trigger);
      const dialog = await screen.findByRole('alertdialog', {
        name: tRevoke('revoke.title', VALUES),
      });
      revokeButton = within(dialog).getByRole('button', {
        name: revokeGrantControl.revoke.confirmButton,
      });
    });

    it('says what locks and that what the tenant set up is kept', () => {
      const description = screen.getByText(
        tRevoke('revoke.description', VALUES),
      );

      expect(description).toBeVisible();
    });

    it('revokes the grant, then confirms by name and refreshes', async () => {
      vi.mocked(revokeEntitlementGrantAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(revokeButton);

      const toast = await screen.findByText(tRevoke('revoke.done', VALUES));

      expect(revokeEntitlementGrantAction).toHaveBeenCalledWith(
        TARGET.tenantId,
        MOCK_GRANT_ID,
      );
      expect(toast).toBeVisible();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('blocks a second click while the revoke is pending', async () => {
      vi.mocked(revokeEntitlementGrantAction).mockReturnValueOnce(
        new Promise(() => {}),
      );
      await user.click(revokeButton);

      const pending = await screen.findByRole('button', {
        name: revokeGrantControl.revoke.confirmingButton,
      });
      await user.click(pending);

      expect(pending).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(revokeEntitlementGrantAction).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        failure: 'a failed revoke',
        fail: () =>
          vi.mocked(revokeEntitlementGrantAction).mockResolvedValueOnce({
            outcome: ACTION_OUTCOME.SERVER_ERROR,
          }),
      },
      {
        failure: 'a request that never reaches the server',
        fail: () =>
          vi
            .mocked(revokeEntitlementGrantAction)
            .mockRejectedValueOnce(MOCK_UNREACHED_REQUEST),
      },
    ])('keeps the dialog open with an alert for $failure', async ({ fail }) => {
      fail();
      await user.click(revokeButton);

      const alert = await screen.findByText(revokeGrantControl.revoke.failed);
      const dialog = screen.getByRole('alertdialog');

      expect(alert).toBeVisible();
      expect(dialog).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });

    it('says the grant was already removed and refreshes the page', async () => {
      vi.mocked(revokeEntitlementGrantAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN,
      });
      await user.click(revokeButton);

      const refusal = await screen.findByText(
        en.entitlementGrantErrors.grantNotOpen,
      );

      expect(refusal).toBeVisible();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('with the remove dialog open on an expired grant', () => {
    beforeEach(async () => {
      setup({
        grants: [
          {
            ...READER_ACCOUNTS_GRANT,
            status: GRANT_STATUS.EXPIRED,
            expiresAt: ENDS_AT,
          },
        ],
      });
      const trigger = screen.getByRole(
        'button',
        removeTrigger(READER_ACCOUNTS),
      );
      await user.click(trigger);
    });

    it('removes the grant so the item can be granted again', async () => {
      vi.mocked(revokeEntitlementGrantAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const removeButton = await screen.findByRole('button', {
        name: revokeGrantControl.remove.confirmButton,
      });
      await user.click(removeButton);

      const toast = await screen.findByText(tRevoke('remove.done', VALUES));

      expect(revokeEntitlementGrantAction).toHaveBeenCalledWith(
        TARGET.tenantId,
        MOCK_GRANT_ID,
      );
      expect(toast).toBeVisible();
    });
  });
});
