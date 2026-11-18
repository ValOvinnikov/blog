import {
  ENTITLEMENT_GRANT_EXPIRY,
  ENTITLEMENT_GRANT_NOTE_MAX_LENGTH,
  ENTITLEMENT_GRANT_REFUSAL,
} from '@platform/constants/entitlement-grant';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import en from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_GRANT_NOTE,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { grantFocusId } from '@platform/utils/grant-focus-id/grant-focus-id';
import { ACTION_OUTCOME } from '@shinefold/config';
import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GrantEntitlementControl } from './grant-entitlement-control';

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { grantDialog, grantExpiryFields, entitlementGrantErrors } = en;
const t = makeEnTranslator('grantEntitlement');
const ITEM_LABEL = en.featuresSettings.toggleLabel[CAPABILITY.READER_ACCOUNTS];
const TARGET = mockGrantTarget({ plan: TENANT_PLAN.STARTER });
const MOCK_ITEM = {
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.READER_ACCOUNTS,
} as const;
const GRANT_BUTTON = { name: grantDialog.confirmButton };
const MOCK_RETURN_FOCUS_ID = grantFocusId(CAPABILITY.READER_ACCOUNTS);
const VALUES = { item: ITEM_LABEL, tenant: TARGET.tenantName };

const setup = customRender(GrantEntitlementControl, {
  target: TARGET,
  item: MOCK_ITEM,
  itemLabel: ITEM_LABEL,
  returnFocusId: MOCK_RETURN_FOCUS_ID,
});

describe(`<${GrantEntitlementControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  it('offers a small grant action that names its item', () => {
    setup();

    const trigger = screen.getByRole('button', {
      name: t('triggerAriaLabel', VALUES),
    });

    expect(trigger).toBeVisible();
    expect(trigger).toHaveTextContent(t('trigger'));
  });

  describe('with the dialog open', () => {
    let expires: HTMLElement;
    let note: HTMLElement;
    let grant: HTMLElement;

    const enterNote = async (text: string) => {
      await user.click(note);
      await user.paste(text);
    };

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', {
        name: t('triggerAriaLabel', VALUES),
      });
      await user.click(trigger);
      expires = await screen.findByRole('combobox', {
        name: grantExpiryFields.expiresLabel,
      });
      note = screen.getByRole('textbox', {
        name: grantExpiryFields.noteLabel,
      });
      grant = screen.getByRole('button', GRANT_BUTTON);
    });

    it('names the tenant, the item and the plan, and says nothing is charged', () => {
      const dialog = screen.getByRole('alertdialog', {
        name: t('title', VALUES),
      });
      const description = screen.getByText(
        t('description', { ...VALUES, plan: en.planNames[TARGET.plan] }),
      );

      expect(dialog).toBeVisible();
      expect(description).toBeVisible();
    });

    it('defaults to never expiring, with an optional note', () => {
      expect(expires).toHaveTextContent(grantExpiryFields.expiry.NEVER);
      expect(note).toHaveValue('');
    });

    it('grants with the expiry and note entered, then closes, confirms and refreshes', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(expires);
      const ninetyDays = await screen.findByRole('option', {
        name: grantExpiryFields.expiry.DAYS_90,
      });
      await user.click(ninetyDays);
      await enterNote(MOCK_GRANT_NOTE);
      await user.click(grant);

      const toast = await screen.findByText(t('granted', { item: ITEM_LABEL }));
      const dialog = screen.queryByRole('alertdialog');

      expect(grantEntitlementAction).toHaveBeenCalledWith(TARGET.tenantId, {
        item: MOCK_ITEM,
        expiry: ENTITLEMENT_GRANT_EXPIRY.DAYS_90,
        note: MOCK_GRANT_NOTE,
      });
      expect(toast).toBeVisible();
      expect(dialog).not.toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('stops the note at its limit', async () => {
      await enterNote('a'.repeat(ENTITLEMENT_GRANT_NOTE_MAX_LENGTH + 1));

      expect(note).toHaveValue('a'.repeat(ENTITLEMENT_GRANT_NOTE_MAX_LENGTH));
    });

    it('blocks a second click while the grant is pending', async () => {
      vi.mocked(grantEntitlementAction).mockReturnValueOnce(
        new Promise(() => {}),
      );
      await user.click(grant);

      const pending = await screen.findByRole('button', {
        name: grantDialog.confirmingButton,
      });
      await user.click(pending);

      expect(pending).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(grantEntitlementAction).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        failure: 'a failed grant',
        fail: () =>
          vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
            outcome: ACTION_OUTCOME.SERVER_ERROR,
          }),
      },
      {
        failure: 'a request that never reaches the server',
        fail: () =>
          vi
            .mocked(grantEntitlementAction)
            .mockRejectedValueOnce(MOCK_UNREACHED_REQUEST),
      },
    ])(
      'keeps the dialog and its values open with an alert for $failure',
      async ({ fail }) => {
        fail();
        await enterNote(MOCK_GRANT_NOTE);
        await user.click(grant);

        const alert = await screen.findByText(
          t('failed', { item: ITEM_LABEL }),
        );

        expect(alert).toBeVisible();
        expect(note).toHaveValue(MOCK_GRANT_NOTE);
        expect(refresh).not.toHaveBeenCalled();
      },
    );

    it.each([
      {
        reason: ENTITLEMENT_GRANT_REFUSAL.ALREADY_GRANTED,
        message: entitlementGrantErrors.alreadyGranted,
      },
      {
        reason: ENTITLEMENT_GRANT_REFUSAL.COMING_SOON,
        message: entitlementGrantErrors.comingSoon,
      },
      {
        reason: TENANT_REFUSAL.ARCHIVED,
        message: entitlementGrantErrors.archived,
      },
    ])(
      'says why a $reason refusal stopped the grant and refreshes the page',
      async ({ reason, message }) => {
        vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.REFUSED,
          reason,
        });
        await user.click(grant);

        const refusal = await screen.findByText(message);

        expect(refusal).toBeVisible();
        expect(refresh).toHaveBeenCalledTimes(1);
      },
    );

    it('starts afresh when reopened after a cancel', async () => {
      await enterNote(MOCK_GRANT_NOTE);
      const cancel = screen.getByRole('button', {
        name: en.confirmDialog.cancelButton,
      });
      await user.click(cancel);
      const trigger = screen.getByRole('button', {
        name: t('triggerAriaLabel', VALUES),
      });
      await user.click(trigger);

      const reopenedNote = await screen.findByRole('textbox', {
        name: grantExpiryFields.noteLabel,
      });

      expect(reopenedNote).toHaveValue('');
    });
  });
});
