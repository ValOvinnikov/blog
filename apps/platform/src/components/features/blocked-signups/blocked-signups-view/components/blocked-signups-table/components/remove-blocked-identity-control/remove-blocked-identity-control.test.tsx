import { ACTION_OUTCOME } from '@blog/config';
import { SIGNUP_BLOCK_REFUSAL } from '@platform/constants/signup-block';
import messages from '@platform/i18n/messages/en.json';
import { removeBlockedIdentityAction } from '@platform/server/signup-block/remove-blocked-identity-action';
import {
  MOCK_BLOCKED_DOMAIN,
  mockBlockedSignupEntry,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveBlockedIdentityControl } from './remove-blocked-identity-control';

vi.mock('@platform/server/signup-block/remove-blocked-identity-action');

const { removeBlockedIdentityControl } = messages;
const t = makeEnTranslator('removeBlockedIdentityControl');

const MOCK_ENTRY = mockBlockedSignupEntry();
const CONFIRM_BUTTON = { name: removeBlockedIdentityControl.confirmButton };

const setup = customRender(RemoveBlockedIdentityControl, {
  entry: MOCK_ENTRY,
});

describe(`<${RemoveBlockedIdentityControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();

    const openDialog = screen.getByRole('button', {
      name: t('triggerAriaLabel', { value: MOCK_BLOCKED_DOMAIN }),
    });
    await user.click(openDialog);
  });

  it('removes the entry only after the operator confirms', async () => {
    const dialog = await screen.findByRole('alertdialog', {
      name: removeBlockedIdentityControl.dialogTitle,
    });

    expect(dialog).toBeVisible();
    expect(removeBlockedIdentityAction).not.toHaveBeenCalled();

    const confirm = screen.getByRole('button', CONFIRM_BUTTON);
    await user.click(confirm);

    expect(removeBlockedIdentityAction).toHaveBeenCalledWith(MOCK_ENTRY.id);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      failure: 'an entry already removed',
      result: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
      },
      message: removeBlockedIdentityControl.alreadyRemoved,
    },
    {
      failure: 'a failed removal',
      result: { outcome: ACTION_OUTCOME.SERVER_ERROR },
      message: removeBlockedIdentityControl.removalFailed,
    },
  ] as const)(
    'keeps the dialog open with the error for $failure',
    async ({ result, message }) => {
      vi.mocked(removeBlockedIdentityAction).mockResolvedValueOnce(result);

      const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      const error = await screen.findByText(message);
      const dialog = screen.getByRole('alertdialog', {
        name: removeBlockedIdentityControl.dialogTitle,
      });

      expect(error).toBeVisible();
      expect(dialog).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    },
  );
});
