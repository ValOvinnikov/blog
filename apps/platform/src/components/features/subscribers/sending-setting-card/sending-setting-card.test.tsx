import { setEmailNewPostsAction } from '@platform/server/subscribers/set-email-new-posts-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SendingSettingCard } from './sending-setting-card';

vi.mock('@platform/server/subscribers/set-email-new-posts-action', () => ({
  setEmailNewPostsAction: vi.fn(),
}));

const t = makeEnTranslator('subscribersPage.sending');
const SWITCH = { name: t('label') };

const setup = customRender(SendingSettingCard, {
  tenantId: MOCK_TENANT_ID,
  isInitiallyOn: true,
});

describe(`<${SendingSettingCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(setEmailNewPostsAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it('saves the setting as soon as it is turned off and shows the off note', async () => {
    setup();
    const toggle = screen.getByRole('switch', SWITCH);

    await user.click(toggle);

    const offNote = screen.getByText(t('offNote'));

    expect(setEmailNewPostsAction).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      false,
    );
    expect(toggle).not.toBeChecked();
    expect(offNote).toBeVisible();
  });

  it('turns back and says so when the save fails', async () => {
    vi.mocked(setEmailNewPostsAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();
    const toggle = screen.getByRole('switch', SWITCH);

    await user.click(toggle);

    const error = await screen.findByRole('alert');

    expect(toggle).toBeChecked();
    expect(error).toHaveTextContent(t('saveFailed'));
  });
});
