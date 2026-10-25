import { ACTION_OUTCOME } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NEWSLETTER_SUBSCRIPTION_ACTION } from '@web/constants/newsletter';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useRouter } from 'next/navigation';

import { NewsletterSubscriptionControl } from './newsletter-subscription-control';

type TToastPromise = (
  promise: Promise<unknown>,
  messages: { error: (failure: unknown) => { message: unknown } },
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

const UNSUBSCRIBE_BUTTON_NAME = 'Unsubscribe';
const RESEND_BUTTON_NAME = 'Resend confirmation';

const setup = customRender(NewsletterSubscriptionControl, {
  action: NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE,
});

let user: UserEvent;

describe(`<${NewsletterSubscriptionControl.name}/>`, () => {
  beforeEach(() => {
    routerRefreshMock.mockReset();
    unsubscribeActionMock.mockReset();
    resendConfirmationActionMock.mockReset();
    toastPromiseMock.mockImplementation((promise) => promise);
    user = userEvent.setup();
  });

  describe('unsubscribe action', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the unsubscribe button copy for the "unsubscribe" action', () => {
      expect(
        screen.getByRole('button', { name: UNSUBSCRIBE_BUTTON_NAME }),
      ).toBeVisible();
    });

    it('runs unsubscribeAction through toast.promise and refreshes the router on success', async () => {
      unsubscribeActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(
        screen.getByRole('button', { name: UNSUBSCRIBE_BUTTON_NAME }),
      );

      await waitFor(() => {
        expect(unsubscribeActionMock).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(routerRefreshMock).toHaveBeenCalledTimes(1);
      });

      expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
        loading: { message: 'Unsubscribing…' },
        success: { message: "You've been unsubscribed." },
        error: expect.any(Function),
      });
      await expect(resolveErrorMessage()).resolves.toBe(
        "Couldn't unsubscribe. Try again.",
      );
    });

    it('does not refresh the router when the action fails', async () => {
      unsubscribeActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await user.click(
        screen.getByRole('button', { name: UNSUBSCRIBE_BUTTON_NAME }),
      );

      await waitFor(() => {
        expect(toastPromiseMock).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: UNSUBSCRIBE_BUTTON_NAME }),
        ).toHaveAttribute('aria-busy', 'false');
      });
      expect(routerRefreshMock).not.toHaveBeenCalled();
    });

    it('marks the button aria-busy while the action is pending, and clears it once settled', async () => {
      let resolveAction!: (result: {
        outcome: typeof ACTION_OUTCOME.SUCCESS;
      }) => void;
      unsubscribeActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      const button = screen.getByRole('button', {
        name: UNSUBSCRIBE_BUTTON_NAME,
      });
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'true');
      });

      resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'false');
      });
    });
  });

  describe('resend action', () => {
    beforeEach(() => {
      setup({ action: NEWSLETTER_SUBSCRIPTION_ACTION.RESEND });
    });

    it('renders the resend button copy for the "resend" action', () => {
      expect(
        screen.getByRole('button', { name: RESEND_BUTTON_NAME }),
      ).toBeVisible();
    });

    it('runs resendConfirmationAction through toast.promise and refreshes the router on success', async () => {
      resendConfirmationActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(
        screen.getByRole('button', { name: RESEND_BUTTON_NAME }),
      );

      await waitFor(() => {
        expect(resendConfirmationActionMock).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(routerRefreshMock).toHaveBeenCalledTimes(1);
      });

      expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
        loading: { message: 'Resending the confirmation email…' },
        success: { message: 'Confirmation email resent.' },
        error: expect.any(Function),
      });
      await expect(resolveErrorMessage()).resolves.toBe(
        "Couldn't resend the confirmation email. Try again.",
      );
    });

    it('toasts the unavailable copy for the "resend" action when it is refused as unavailable', async () => {
      resendConfirmationActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.UNAVAILABLE,
      });
      await user.click(
        screen.getByRole('button', { name: RESEND_BUTTON_NAME }),
      );

      await waitFor(() => {
        expect(toastPromiseMock).toHaveBeenCalled();
      });
      await expect(resolveErrorMessage()).resolves.toBe(
        "Resending isn't available on this site right now.",
      );
    });
  });
});
