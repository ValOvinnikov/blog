import { ACTION_OUTCOME } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NEWSLETTER_SUBSCRIPTION_ACTION } from '@web/constants/newsletter';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useRouter } from 'next/navigation';

import { NewsletterSubscriptionControl } from './newsletter-subscription-control';

type TToastPromise = (
  promise: Promise<unknown>,
  messages: {
    loading: { message: string };
    success: { message: string };
    error: (failure: unknown) => { message: unknown };
  },
) => Promise<unknown>;

const {
  routerRefreshMock,
  unsubscribeActionMock,
  resendConfirmationActionMock,
  toastPromiseMock,
} = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
  unsubscribeActionMock: vi.fn(),
  resendConfirmationActionMock: vi.fn(),
  toastPromiseMock: vi.fn<TToastPromise>((promise) => promise),
}));

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

vi.mock(
  '@web/server/newsletter/newsletter-subscription-actions/newsletter-subscription-actions',
  () => ({
    unsubscribeAction: unsubscribeActionMock,
    resendConfirmationAction: resendConfirmationActionMock,
  }),
);

vi.mock('@web/context/toast-provider', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    promise: toastPromiseMock,
    dismiss: vi.fn(),
  }),
}));

const resolveErrorMessage = async (): Promise<unknown> => {
  const { error } = toastPromiseMock.mock.calls[0]![1];
  const settled = toastPromiseMock.mock.results[0]!.value as Promise<unknown>;
  const failure = await settled.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error(failure).message;
};

const RESEND_BUTTON_NAME = 'Resend confirmation';

const ACTION_CASES = [
  {
    action: NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE,
    buttonName: 'Unsubscribe',
    actionMock: unsubscribeActionMock,
    loadingMessage: 'Unsubscribing…',
    successMessage: "You've been unsubscribed.",
    errorMessage: "Couldn't unsubscribe. Try again.",
  },
  {
    action: NEWSLETTER_SUBSCRIPTION_ACTION.RESEND,
    buttonName: RESEND_BUTTON_NAME,
    actionMock: resendConfirmationActionMock,
    loadingMessage: 'Resending the confirmation email…',
    successMessage: 'Confirmation email resent.',
    errorMessage: "Couldn't resend the confirmation email. Try again.",
  },
];

const setup = customRender(NewsletterSubscriptionControl, {
  action: NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE,
});

describe(`<${NewsletterSubscriptionControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    routerRefreshMock.mockReset();
    unsubscribeActionMock.mockReset();
    resendConfirmationActionMock.mockReset();
    toastPromiseMock.mockImplementation((promise) => promise);
    user = userEvent.setup();
  });

  describe.each(ACTION_CASES)(
    'the $buttonName button',
    ({
      action,
      buttonName,
      actionMock,
      loadingMessage,
      successMessage,
      errorMessage,
    }) => {
      beforeEach(() => {
        setup({ action });
      });

      it('is labelled for its action', () => {
        const button = screen.getByRole('button', { name: buttonName });

        expect(button).toBeVisible();
      });

      it('runs the action with progress toasts and refreshes the page', async () => {
        actionMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        await waitFor(() => {
          expect(routerRefreshMock).toHaveBeenCalledTimes(1);
        });
        const { loading, success } = toastPromiseMock.mock.calls[0]![1];
        expect(actionMock).toHaveBeenCalledTimes(1);
        expect(loading).toEqual({ message: loadingMessage });
        expect(success).toEqual({ message: successMessage });
      });

      it('shows the error toast and keeps the page when the action fails', async () => {
        actionMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SERVER_ERROR });
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        await waitFor(() => {
          expect(button).toHaveAttribute('aria-busy', 'false');
        });
        await expect(resolveErrorMessage()).resolves.toBe(errorMessage);
        expect(routerRefreshMock).not.toHaveBeenCalled();
      });

      it('marks the button busy until the action settles', async () => {
        let resolveAction!: (result: {
          outcome: typeof ACTION_OUTCOME.SUCCESS;
        }) => void;
        actionMock.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveAction = resolve;
            }),
        );
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        await waitFor(() => {
          expect(button).toHaveAttribute('aria-busy', 'true');
        });
        resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
        await waitFor(() => {
          expect(button).toHaveAttribute('aria-busy', 'false');
        });
      });
    },
  );

  it('says resending is unavailable when the site refuses it', async () => {
    resendConfirmationActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    setup({ action: NEWSLETTER_SUBSCRIPTION_ACTION.RESEND });
    const button = screen.getByRole('button', { name: RESEND_BUTTON_NAME });

    await user.click(button);

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });
    await expect(resolveErrorMessage()).resolves.toBe(
      "Resending isn't available on this site right now.",
    );
  });
});
