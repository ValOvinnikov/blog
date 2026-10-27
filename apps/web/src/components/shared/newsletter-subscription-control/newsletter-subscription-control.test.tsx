import { ACTION_OUTCOME } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NEWSLETTER_SUBSCRIPTION_ACTION } from '@web/constants/newsletter';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { withToastProvider } from '@web/testing/providers';
import { useRouter } from 'next/navigation';

import { NewsletterSubscriptionControl } from './newsletter-subscription-control';

const { unsubscribeActionMock, resendConfirmationActionMock } = vi.hoisted(
  () => ({
    unsubscribeActionMock: vi.fn(),
    resendConfirmationActionMock: vi.fn(),
  }),
);

vi.mock(
  '@web/server/newsletter/newsletter-subscription-actions/newsletter-subscription-actions',
  () => ({
    unsubscribeAction: unsubscribeActionMock,
    resendConfirmationAction: resendConfirmationActionMock,
  }),
);

const routerRefreshMock = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

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

const setup = customRender(withToastProvider(NewsletterSubscriptionControl), {
  action: NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE,
});

describe(`<${NewsletterSubscriptionControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
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

      it('announces success and refreshes the page', async () => {
        actionMock.mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SUCCESS });
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        const toast = await screen.findByRole('status');
        expect(toast).toHaveTextContent(successMessage);
        expect(actionMock).toHaveBeenCalledTimes(1);
        await waitFor(() => {
          expect(routerRefreshMock).toHaveBeenCalledTimes(1);
        });
      });

      it('announces the failure and keeps the page when the action fails', async () => {
        actionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        const toast = await screen.findByRole('alert');
        expect(toast).toHaveTextContent(errorMessage);
        expect(routerRefreshMock).not.toHaveBeenCalled();
      });

      it('shows progress and marks the button busy until the action settles', async () => {
        let resolveAction!: (result: {
          outcome: typeof ACTION_OUTCOME.SUCCESS;
        }) => void;
        actionMock.mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveAction = resolve;
            }),
        );
        const button = screen.getByRole('button', { name: buttonName });

        await user.click(button);

        const progressToast = await screen.findByRole('status');
        expect(progressToast).toHaveTextContent(loadingMessage);
        expect(button).toHaveAttribute('aria-busy', 'true');

        resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

        await waitFor(() => {
          expect(button).toHaveAttribute('aria-busy', 'false');
        });
      });
    },
  );

  it('says resending is unavailable when the site refuses it', async () => {
    resendConfirmationActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    setup({ action: NEWSLETTER_SUBSCRIPTION_ACTION.RESEND });
    const button = screen.getByRole('button', { name: RESEND_BUTTON_NAME });

    await user.click(button);

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent(
      "Resending isn't available on this site right now.",
    );
  });
});
