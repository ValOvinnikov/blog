import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { sendSignInLinkAction } from '@platform/server/auth/send-sign-in-link-action';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSignInForm } from './email-sign-in-form';

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const EMAIL_FIELD = { name: 'Email address' };
const SEND_BUTTON = { name: 'Email me a sign-in link' };

const setup = customRender(EmailSignInForm, {
  callbackPath: adminRoutes.dashboard(),
});

describe(`<${EmailSignInForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    vi.mocked(sendSignInLinkAction)
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    setup();
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);
    await user.type(emailField, MOCK_SIGN_IN_EMAIL);
  });

  it('sends a link for the requested page and asks the user to check email', async () => {
    const sendButton = screen.getByRole('button', SEND_BUTTON);
    await user.click(sendButton);

    const status = await screen.findByRole('status');

    expect(sendSignInLinkAction).toHaveBeenCalledWith({
      email: MOCK_SIGN_IN_EMAIL,
      callbackPath: adminRoutes.dashboard(),
    });
    expect(status).toHaveTextContent(
      `Check your emailWe've sent a sign-in link to ${MOCK_SIGN_IN_EMAIL}. It works once and expires after a while.`,
    );
  });

  it('shows the field error for an address the action refuses', async () => {
    vi.mocked(sendSignInLinkAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
    });

    const sendButton = screen.getByRole('button', SEND_BUTTON);
    await user.click(sendButton);

    const error = await screen.findByText('Enter a valid email.');
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);

    expect(error).toBeVisible();
    expect(emailField).toHaveValue(MOCK_SIGN_IN_EMAIL);
  });

  it('says the link could not be sent and keeps the address', async () => {
    vi.mocked(sendSignInLinkAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const sendButton = screen.getByRole('button', SEND_BUTTON);
    await user.click(sendButton);

    const alert = await screen.findByRole('alert');
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);

    expect(alert).toHaveTextContent(
      "We couldn't send your sign-in linkTry again in a few minutes.",
    );
    expect(emailField).toHaveValue(MOCK_SIGN_IN_EMAIL);
  });

  it('says too many links were requested for the address', async () => {
    vi.mocked(sendSignInLinkAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.RATE_LIMITED,
    });

    const sendButton = screen.getByRole('button', SEND_BUTTON);
    await user.click(sendButton);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Too many sign-in links were requested for this addressTry again in an hour.',
    );
  });
});
