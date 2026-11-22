import { SUBSCRIBERS_REFUSAL } from '@platform/constants/subscribers';
import { removeSubscriberAction } from '@platform/server/subscribers/remove-subscriber-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_SUBSCRIBER_EMAIL,
  mockConfirmedSubscriber,
} from '@platform/testing/subscribers/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveSubscriberControl } from './remove-subscriber-control';

vi.mock('@platform/server/subscribers/remove-subscriber-action', () => ({
  removeSubscriberAction: vi.fn(),
}));

const t = makeEnTranslator('subscribersPage.remove');
const MOCK_SUBSCRIBER = mockConfirmedSubscriber({
  email: MOCK_SUBSCRIBER_EMAIL,
});
const CONFIRM_BUTTON = { name: t('confirm') };

const setup = customRender(RemoveSubscriberControl, {
  tenantId: MOCK_TENANT_ID,
  subscriber: MOCK_SUBSCRIBER,
});

describe(`<${RemoveSubscriberControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(removeSubscriberAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    const trigger = screen.getByRole('button', {
      name: t('trigger', { email: MOCK_SUBSCRIBER_EMAIL }),
    });
    await user.click(trigger);
  });

  it('asks first, naming the subscriber, then removes them', async () => {
    const dialog = await screen.findByRole('alertdialog', { name: t('title') });

    expect(dialog).toHaveTextContent(MOCK_SUBSCRIBER_EMAIL);
    expect(removeSubscriberAction).not.toHaveBeenCalled();

    const confirm = screen.getByRole('button', CONFIRM_BUTTON);
    await user.click(confirm);

    expect(removeSubscriberAction).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER.id,
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a failed removal', { outcome: ACTION_OUTCOME.SERVER_ERROR }, t('failed')],
    [
      'a subscriber already gone',
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SUBSCRIBERS_REFUSAL.NOT_FOUND,
      },
      t('alreadyRemoved'),
    ],
  ] as const)(
    'keeps the dialog open with the error for %s',
    async (_, result, message) => {
      vi.mocked(removeSubscriberAction).mockResolvedValueOnce(result);

      const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      const dialog = screen.getByRole('alertdialog', { name: t('title') });
      const error = await screen.findByText(message);

      expect(dialog).toContainElement(error);
      expect(refresh).not.toHaveBeenCalled();
    },
  );
});
