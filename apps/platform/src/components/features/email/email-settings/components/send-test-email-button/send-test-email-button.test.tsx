import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import {
  sendTestEmailAction,
  type TSendTestEmailResult,
} from '@platform/server/email/send-test-email-action';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen } from '@platform/testing/custom-render';
import { SEND_TEST_TO_ME } from '@platform/testing/email/fixtures';
import {
  MOCK_EMAIL_BODY,
  mockEmailSender,
} from '@platform/testing/email-draft';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME, EMAIL_TEMPLATE_TYPE } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SendTestEmailButton } from './send-test-email-button';

faker.seed(5993);

vi.mock('@platform/server/email/send-test-email-action');

const { testSent, testInvalid, testRateLimited, testFailed } = en.emailPreview;
const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_SENDER_NAME = faker.company.name();
const TIME_PLACEHOLDER = '{time}';

const setup = customRenderInSettingsForm(SendTestEmailButton, {
  tenantId: MOCK_TENANT_ID,
  email: {
    templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    subject: MOCK_SUBJECT,
    body: MOCK_EMAIL_BODY,
    sender: mockEmailSender({ senderName: MOCK_SENDER_NAME }),
  },
});

describe(`<${SendTestEmailButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('for an active tenant', () => {
    let sendButton: HTMLElement;

    beforeEach(() => {
      setup();
      sendButton = screen.getByRole('button', { name: SEND_TEST_TO_ME });
    });

    it('sends the email as a test and says where it went', async () => {
      await user.click(sendButton);

      const confirmation = await screen.findByText(
        testSent.replace('{email}', MOCK_ADMIN_EMAIL),
      );

      expect(confirmation).toBeVisible();
      expect(sendTestEmailAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
        copy: { subject: MOCK_SUBJECT, body: MOCK_EMAIL_BODY },
        sender: {
          senderName: MOCK_SENDER_NAME,
          replyToAddress: null,
          footerPostalAddress: null,
        },
      });
    });

    it.each<{ result: TSendTestEmailResult; message: string }>([
      {
        result: { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} },
        message: testInvalid,
      },
      {
        result: { outcome: ACTION_OUTCOME.SERVER_ERROR },
        message: testFailed,
      },
    ])(
      'says why the test was not sent on $result.outcome',
      async ({ result, message }) => {
        vi.mocked(sendTestEmailAction).mockResolvedValueOnce(result);

        await user.click(sendButton);

        const failure = await screen.findByText(message);

        expect(failure).toBeVisible();
      },
    );

    it('says when to try again once the sender hits the test limit', async () => {
      const [limitCopy = ''] = testRateLimited.split(TIME_PLACEHOLDER);
      vi.mocked(sendTestEmailAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.RATE_LIMITED,
        retryAt: new Date().toISOString(),
      });

      await user.click(sendButton);

      const refusal = await screen.findByText((text) =>
        text.startsWith(limitCopy),
      );

      expect(refusal).not.toHaveTextContent(TIME_PLACEHOLDER);
    });
  });

  it('locks the test send for an archived tenant, saying why', async () => {
    setup({}, { isArchived: true });

    const sendButton = screen.getByRole('button', { name: SEND_TEST_TO_ME });
    await user.click(sendButton);

    expect(sendButton).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(sendButton).toHaveAccessibleDescription(ARCHIVED_NOTICE_TEXT);
    expect(sendTestEmailAction).not.toHaveBeenCalled();
  });
});
