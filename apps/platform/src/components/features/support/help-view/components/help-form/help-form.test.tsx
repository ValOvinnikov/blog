import { faker } from '@faker-js/faker';
import {
  SUPPORT_FIELD_ERROR,
  SUPPORT_LIMIT,
} from '@platform/constants/support';
import messages from '@platform/i18n/messages/en.json';
import { sendSupportMessageAction } from '@platform/server/support/send-support-message-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { HelpForm } from './help-form';

vi.mock('@platform/server/support/send-support-message-action');

faker.seed(7184);

const { helpForm } = messages;
const SUBJECT_FIELD = { name: helpForm.subjectLabel };
const MESSAGE_FIELD = { name: helpForm.messageLabel };
const SEND_BUTTON = { name: helpForm.send };
const MOCK_SUBJECT = faker.lorem.words(3);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_ORIGIN_PATH = `/dashboard/${faker.lorem.word()}`;

const setup = customRender(HelpForm, {
  tenantId: MOCK_TENANT_ID,
  originPath: MOCK_ORIGIN_PATH,
});

describe(`<${HelpForm.name}/>`, () => {
  let user: UserEvent;
  let subjectField: HTMLElement;
  let messageField: HTMLElement;
  let sendButton: HTMLElement;

  beforeEach(async () => {
    user = userEvent.setup();
    setup();

    subjectField = screen.getByRole('textbox', SUBJECT_FIELD);
    messageField = screen.getByRole('textbox', MESSAGE_FIELD);
    sendButton = screen.getByRole('button', SEND_BUTTON);
    await user.type(subjectField, MOCK_SUBJECT);
    await user.type(messageField, MOCK_MESSAGE);
  });

  it('sends the subject, message and originating page, then clears the form', async () => {
    await user.click(sendButton);

    const confirmation = await screen.findByText(helpForm.sent);

    expect(sendSupportMessageAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      subject: MOCK_SUBJECT,
      message: MOCK_MESSAGE,
      originPath: MOCK_ORIGIN_PATH,
    });
    expect(confirmation).toBeVisible();
    expect(messageField).toHaveValue('');
  });

  it('shows why a field was refused and keeps the input', async () => {
    vi.mocked(sendSupportMessageAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        message: {
          reason: SUPPORT_FIELD_ERROR.TOO_LONG,
          values: { limit: SUPPORT_LIMIT.MESSAGE_MAX_LENGTH },
        },
      },
    });
    const tooLong = makeEnTranslator('helpForm')('tooLong', {
      limit: SUPPORT_LIMIT.MESSAGE_MAX_LENGTH,
    });

    await user.click(sendButton);

    const error = await screen.findByText(tooLong);

    expect(error).toBeVisible();
    expect(messageField).toHaveValue(MOCK_MESSAGE);
  });

  it.each([
    [ACTION_OUTCOME.RATE_LIMITED, helpForm.rateLimited],
    [ACTION_OUTCOME.UNAVAILABLE, helpForm.unavailable],
    [ACTION_OUTCOME.SERVER_ERROR, helpForm.sendFailed],
  ] as const)(
    'says why the message was not sent on %s and keeps the input',
    async (outcome, text) => {
      vi.mocked(sendSupportMessageAction).mockResolvedValueOnce({ outcome });

      await user.click(sendButton);

      const error = await screen.findByText(text);

      expect(error).toBeVisible();
      expect(subjectField).toHaveValue(MOCK_SUBJECT);
    },
  );

  it('keeps the input when the request never reaches the server', async () => {
    vi.mocked(sendSupportMessageAction).mockRejectedValueOnce(
      MOCK_UNREACHED_REQUEST,
    );

    await user.click(sendButton);

    const error = await screen.findByText(helpForm.sendFailed);

    expect(error).toBeVisible();
    expect(messageField).toHaveValue(MOCK_MESSAGE);
  });
});
