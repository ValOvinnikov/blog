import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useState } from 'react';

import { useEmailSignIn } from './use-email-sign-in';

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
}));

/**
 * Minimal harness that wires the hook's state onto real form controls so the
 * DOM-dependent behaviour (focus-on-expand, submit, reset-on-close) can be
 * exercised directly against the hook, independent of `SignInMenu`. The
 * "toggle open" button stands in for `AuthMenu`'s own `usePopover()` state,
 * which this hook receives as a parameter rather than owning itself.
 */
const Harness = () => {
  const [open, setOpen] = useState(true);
  const {
    emailStep,
    setEmailStep,
    email,
    setEmail,
    emailError,
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
          continue with email
        </button>
      )}
      {(emailStep === 'expanded' || emailStep === 'submitting') && (
        <form ref={emailFormRef} onSubmit={handleEmailSubmit}>
          <input
            aria-label="Email address"
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
      {emailError && <p role="alert">error</p>}
    </div>
  );
};

const setup = customRender(Harness, {});

describe(useEmailSignIn, () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('starts collapsed', () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'continue with email' }),
    ).toBeVisible();
  });

  it('moves focus into the field once it expands', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: 'continue with email' }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toHaveFocus();
    });
  });

  it('submits and moves to the sent step on success', async () => {
    signInMock.mockResolvedValue({
      ok: true,
      error: undefined,
      code: undefined,
      status: 200,
      url: null,
    });
    setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: 'continue with email' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'reader@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'send' }));

    expect(signInMock).toHaveBeenCalledWith('email', {
      email: 'reader@example.com',
      redirect: false,
    });
    expect(await screen.findByRole('status')).toBeVisible();
  });

  it('shows an error and stays expanded when the sign-in fails', async () => {
    signInMock.mockResolvedValue({
      ok: false,
      error: 'EmailSignin',
      code: undefined,
      status: 401,
      url: null,
    });
    setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: 'continue with email' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'reader@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'send' }));

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('resets to collapsed once the popover itself closes', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: 'continue with email' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'reader@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'toggle open' }));

    expect(
      screen.getByRole('button', { name: 'continue with email' }),
    ).toBeVisible();
  });
});
