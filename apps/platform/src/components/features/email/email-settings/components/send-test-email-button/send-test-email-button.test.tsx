import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { screen } from '@platform/testing/custom-render';
import { EMAIL_BODY } from '@platform/testing/email-draft';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SendTestEmailButton } from './send-test-email-button';

const { sendTestEmailActionMock } = vi.hoisted(() => ({
  sendTestEmailActionMock: vi.fn(),
}));

vi.mock('@platform/server/email/send-test-email-action', () => ({
  sendTestEmailAction: sendTestEmailActionMock,
}));

const setup = customRenderInSettingsForm(SendTestEmailButton, {
  tenantId: 'tenant-1',
  email: {
    templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    subject: 'Join Acme',
    body: EMAIL_BODY,
    sender: {
      senderName: 'Acme Co',
      replyToAddress: '',
      footerPostalAddress: '',
    },
  },
});

describe(`<${SendTestEmailButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    sendTestEmailActionMock.mockReset();
    sendTestEmailActionMock.mockResolvedValue({
      ok: true,
      to: 'admin@example.com',
    });
  });

  it('sends the email as a test and says where it went', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: 'Send test to me' }));

    expect(
      await screen.findByText('Test sent to admin@example.com.'),
    ).toBeVisible();
    expect(sendTestEmailActionMock).toHaveBeenCalledWith('tenant-1', {
      templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      copy: { subject: 'Join Acme', body: EMAIL_BODY },
      sender: {
        senderName: 'Acme Co',
        replyToAddress: null,
        footerPostalAddress: null,
      },
    });
  });

  it('says when the test could not be sent', async () => {
    sendTestEmailActionMock.mockResolvedValue({ ok: false, reason: 'failed' });
    setup();

    await user.click(screen.getByRole('button', { name: 'Send test to me' }));

    expect(
      await screen.findByText("Couldn't send the test — try again."),
    ).toBeVisible();
  });

  it('offers no test send for an archived tenant', () => {
    setup({}, { isArchived: true });

    expect(
      screen.getByRole('button', { name: 'Send test to me' }),
    ).toBeDisabled();
  });
});
