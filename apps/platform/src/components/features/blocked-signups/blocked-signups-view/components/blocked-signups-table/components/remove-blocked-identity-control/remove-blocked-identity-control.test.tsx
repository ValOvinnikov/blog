import { ACTION_OUTCOME } from '@blog/config';
import { SIGNUP_BLOCK_REFUSAL } from '@platform/constants/signup-block';
import {
  BLOCKED_DOMAIN,
  makeBlockedSignupEntry,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveBlockedIdentityControl } from './remove-blocked-identity-control';

const { removeBlockedIdentityActionMock } = vi.hoisted(() => ({
  removeBlockedIdentityActionMock: vi.fn(),
}));

vi.mock('@platform/server/signup-block/remove-blocked-identity-action', () => ({
  removeBlockedIdentityAction: removeBlockedIdentityActionMock,
}));

const ENTRY = makeBlockedSignupEntry();
const CONFIRM_BUTTON = { name: 'Remove block' };

const setup = customRender(RemoveBlockedIdentityControl, { entry: ENTRY });

describe(`<${RemoveBlockedIdentityControl.name}/>`, () => {
  const refreshMock = vi.fn();
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    removeBlockedIdentityActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
    setup();

    await user.click(
      screen.getByRole('button', { name: `Remove block ${BLOCKED_DOMAIN}` }),
    );
  });

  it('removes the entry only after the operator confirms', async () => {
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Remove this block?',
    });

    expect(dialog).toBeVisible();
    expect(removeBlockedIdentityActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', CONFIRM_BUTTON));

    expect(removeBlockedIdentityActionMock).toHaveBeenCalledWith(ENTRY.id);
    expect(refreshMock).toHaveBeenCalled();
  });

  it('keeps the dialog open with the refusal for an entry already removed', async () => {
    removeBlockedIdentityActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
    });

    await user.click(await screen.findByRole('button', CONFIRM_BUTTON));

    const refusal = await screen.findByText('This block was already removed.');

    expect(refusal).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with an error when removal fails', async () => {
    removeBlockedIdentityActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await user.click(await screen.findByRole('button', CONFIRM_BUTTON));

    const error = await screen.findByText(
      "Couldn't remove the block — try again.",
    );

    expect(error).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
