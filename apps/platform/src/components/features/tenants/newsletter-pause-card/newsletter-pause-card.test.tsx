import { ACTION_OUTCOME } from '@blog/config';
import { NEWSLETTER_PAUSE_REFUSAL } from '@platform/constants/newsletter-pause';
import messages from '@platform/i18n/messages/en.json';
import { clearNewsletterPauseAction } from '@platform/server/newsletter-pause/clear-newsletter-pause-action';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_NEWSLETTER_PAUSED_AT,
  MOCK_NEWSLETTER_PAUSED_ON_TEXT,
} from '@platform/testing/email/fixtures';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { NewsletterPauseCard } from './newsletter-pause-card';

vi.mock('@platform/server/newsletter-pause/clear-newsletter-pause-action');

const { newsletterPauseCard } = messages;
const CONFIRM_BUTTON = { name: newsletterPauseCard.confirmButton };

const setup = customRender(NewsletterPauseCard, {
  tenantId: MOCK_TENANT_ID,
  pausedAt: MOCK_NEWSLETTER_PAUSED_AT,
});

describe(`<${NewsletterPauseCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();
  });

  it('shows that the newsletter is paused and since when', () => {
    const heading = screen.getByRole('heading', {
      name: newsletterPauseCard.title,
    });
    const pausedOn = screen.getByText(MOCK_NEWSLETTER_PAUSED_ON_TEXT);

    expect(heading).toBeVisible();
    expect(pausedOn.tagName).toBe('TIME');
    expect(pausedOn).toHaveAttribute(
      'datetime',
      MOCK_NEWSLETTER_PAUSED_AT.toISOString(),
    );
  });

  describe('with the clear dialog open', () => {
    beforeEach(async () => {
      const openDialog = screen.getByRole('button', {
        name: newsletterPauseCard.openDialogButton,
      });
      await user.click(openDialog);
    });

    it('clears the pause only after the operator confirms, then refreshes', async () => {
      const dialog = await screen.findByRole('alertdialog', {
        name: newsletterPauseCard.dialogTitle,
      });

      expect(dialog).toBeVisible();
      expect(clearNewsletterPauseAction).not.toHaveBeenCalled();

      const confirm = screen.getByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      expect(clearNewsletterPauseAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        failure: 'a pause already cleared',
        result: {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: NEWSLETTER_PAUSE_REFUSAL.NOT_PAUSED,
        },
        message: newsletterPauseCard.alreadyCleared,
      },
      {
        failure: 'a failed clear',
        result: { outcome: ACTION_OUTCOME.SERVER_ERROR },
        message: newsletterPauseCard.clearFailed,
      },
    ] as const)(
      'keeps the dialog open with the error for $failure',
      async ({ result, message }) => {
        vi.mocked(clearNewsletterPauseAction).mockResolvedValueOnce(result);

        const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
        await user.click(confirm);

        const error = await screen.findByText(message);

        expect(error).toBeVisible();
        expect(refresh).not.toHaveBeenCalled();
      },
    );

    it('shows the failure when the request never reaches the server', async () => {
      vi.mocked(clearNewsletterPauseAction).mockRejectedValueOnce(
        MOCK_UNREACHED_REQUEST,
      );

      const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      const error = await screen.findByText(newsletterPauseCard.clearFailed);

      expect(error).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});
