import { HTTP_STATUS, MAGIC_LINK_SIGN_IN_CODE } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useState } from 'react';

import { useEmailSignIn } from './use-email-sign-in';

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
}));

const CONTINUE_WITH_EMAIL = 'continue with email';
const EMAIL_FIELD = 'Email address';
const READER_EMAIL = 'reader@example.com';

const Harness = () => {
  const [open, setOpen] = useState(true);
  const {
    emailStep,
    setEmailStep,
    email,
    setEmail,
    emailError,
    isSendLimited,
    emailFormRef,
    handleEmailSubmit,
  } = useEmailSignIn(open);

  return (
    <div>
      <button type="button" onClick={() => setOpen((current) => !current)}>
        toggle open
      </button>
      {emailStep === 'collapsed' && (
        <button type="button" onClick={() => setEmailStep('expanded')}>
          {CONTINUE_WITH_EMAIL}
        </button>
      )}
      {(emailStep === 'expanded' || emailStep === 'submitting') && (
        <form ref={emailFormRef} onSubmit={handleEmailSubmit}>
          <input
            aria-label={EMAIL_FIELD}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={emailStep === 'submitting'}
          />
          <button
            type="button"
            disabled={emailStep === 'submitting'}
            onClick={handleEmailSubmit}
          >
            {emailStep === 'submitting' ? 'sending' : 'send'}
          </button>
        </form>
      )}
      {emailStep === 'sent' && <p role="status">sent</p>}
      {emailError && <p role="alert">{isSendLimited ? 'limited' : 'error'}</p>}
    </div>
  );
};

const setup = customRender(Harness, {});

describe(useEmailSignIn, () => {
  let user: UserEvent;

  const expandEmailForm = async () => {
    const continueWithEmail = screen.getByRole('button', {
      name: CONTINUE_WITH_EMAIL,
    });
    await user.click(continueWithEmail);
  };

  const typeEmail = async () => {
    await expandEmailForm();
    const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
    await user.type(emailField, READER_EMAIL);
  };

  const submitEmail = async () => {
    await typeEmail();
    const sendButton = screen.getByRole('button', { name: 'send' });
    await user.click(sendButton);
  };

  const refuseSignIn = (code?: string) =>
    signInMock.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      code,
      status: HTTP_STATUS.UNAUTHORIZED,
      url: null,
    });

  beforeEach(() => {
    signInMock.mockReset();
    setup();
    user = userEvent.setup();
  });

  it('starts collapsed', () => {
    const continueWithEmail = screen.getByRole('button', {
      name: CONTINUE_WITH_EMAIL,
    });
    expect(continueWithEmail).toBeVisible();
  });

  it('moves focus into the field once it expands', async () => {
    await expandEmailForm();

    const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
    await waitFor(() => {
      expect(emailField).toHaveFocus();
    });
  });

  it('submits and moves to the sent step on success', async () => {
    signInMock.mockResolvedValue({
      ok: true,
      error: undefined,
      code: undefined,
      status: HTTP_STATUS.OK,
      url: null,
    });
    await submitEmail();

    expect(signInMock).toHaveBeenCalledWith('email', {
      email: READER_EMAIL,
      redirect: false,
    });
    const sentNotice = await screen.findByRole('status');
    expect(sentNotice).toBeVisible();
  });

  it('shows an error and stays expanded when the sign-in fails', async () => {
    refuseSignIn();
    await submitEmail();

    const errorNotice = await screen.findByRole('alert');
    expect(errorNotice).toHaveTextContent('error');
    const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
    expect(emailField).toBeVisible();
  });

  it('tells a send refused by the send limit apart from a failed one', async () => {
    refuseSignIn(MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED);
    await submitEmail();

    const errorNotice = await screen.findByRole('alert');
    expect(errorNotice).toHaveTextContent('limited');
  });

  it('resets to collapsed once the popover itself closes', async () => {
    await typeEmail();
    const toggleOpen = screen.getByRole('button', { name: 'toggle open' });
    await user.click(toggleOpen);

    const continueWithEmail = screen.getByRole('button', {
      name: CONTINUE_WITH_EMAIL,
    });
    expect(continueWithEmail).toBeVisible();
  });
});
