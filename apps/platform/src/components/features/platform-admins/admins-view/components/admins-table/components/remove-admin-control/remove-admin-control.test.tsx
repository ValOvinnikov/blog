import {
  ADMINS_HEADING_ID,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import messages from '@platform/i18n/messages/en.json';
import { removeAdminAction } from '@platform/server/platform-admins/remove-admin-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_LISTED_ADMIN_ID,
  MOCK_LISTED_ADMIN_NAME,
} from '@platform/testing/platform-admins/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveAdminControl } from './remove-admin-control';

vi.mock('@platform/server/platform-admins/remove-admin-action');

const { removeAdminControl, adminsTable } = messages;
const t = makeEnTranslator('removeAdminControl');
const NAMED = { name: MOCK_LISTED_ADMIN_NAME };

const RemoveAdminHarness = () => (
  <>
    <h2 id={ADMINS_HEADING_ID} tabIndex={-1}>
      {adminsTable.title}
    </h2>
    <RemoveAdminControl
      adminId={MOCK_LISTED_ADMIN_ID}
      displayName={MOCK_LISTED_ADMIN_NAME}
    />
  </>
);

const setup = customRender(RemoveAdminHarness, {});

describe(`<${RemoveAdminControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  const confirm = async () => {
    const confirmButton = await screen.findByRole('button', {
      name: removeAdminControl.confirm,
    });
    await user.click(confirmButton);
  };

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();

    const trigger = screen.getByRole('button', {
      name: t('triggerAriaLabel', NAMED),
    });
    await user.click(trigger);
  });

  it('asks before removing, naming the admin', async () => {
    const dialog = await screen.findByRole('alertdialog', {
      name: t('title', NAMED),
    });

    expect(dialog).toBeVisible();
    expect(removeAdminAction).not.toHaveBeenCalled();
  });

  it('removes the admin, confirms it and focuses the table title', async () => {
    await confirm();

    const toast = await screen.findByText(t('done', NAMED));
    const heading = screen.getByRole('heading', { name: adminsTable.title });

    expect(removeAdminAction).toHaveBeenCalledWith(MOCK_LISTED_ADMIN_ID);
    expect(toast).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
    expect(heading).toHaveFocus();
  });

  it('keeps the dialog open and says why when the last super admin is refused', async () => {
    vi.mocked(removeAdminAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.LAST_SUPERADMIN,
    });

    await confirm();

    const error = await screen.findByText(removeAdminControl.lastSuperAdmin);
    const dialog = screen.getByRole('alertdialog');

    expect(error).toBeVisible();
    expect(dialog).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
