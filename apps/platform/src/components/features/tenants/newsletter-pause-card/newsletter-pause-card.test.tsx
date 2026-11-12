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
const OPEN_DIALOG_BUTTON = { name: newsletterPauseCard.openDialogButton };
const CONFIRM_BUTTON = { name: newsletterPauseCard.confirmButton };
const DIALOG = { name: newsletterPauseCard.dialogTitle };

const setup = customRender(NewsletterPauseCard, {
  tenantId: MOCK_TENANT_ID,
  pausedAt: MOCK_NEWSLETTER_PAUSED_AT,
  canClear: true,
});

describe(`<${NewsletterPauseCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  it('shows that the newsletter is paused and since when', () => {
    setup();

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

  it('offers no clear action to an admin who cannot clear the pause', () => {
    setup({ canClear: false });

    const openDialog = screen.queryByRole('button', OPEN_DIALOG_BUTTON);
    const pausedOn = screen.getByText(MOCK_NEWSLETTER_PAUSED_ON_TEXT);

    expect(openDialog).not.toBeInTheDocument();
    expect(pausedOn).toBeVisible();
  });

  describe('with the clear dialog open', () => {
    beforeEach(async () => {
      setup();
      const openDialog = screen.getByRole('button', OPEN_DIALOG_BUTTON);
      await user.click(openDialog);
    });

    it('clears the pause only after the operator confirms, then refreshes', async () => {
      const dialog = await screen.findByRole('alertdialog', DIALOG);

      expect(dialog).toBeVisible();
      expect(clearNewsletterPauseAction).not.toHaveBeenCalled();

      const confirm = screen.getByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      expect(clearNewsletterPauseAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        failure: 'a failed clear',
        fail: () =>
          vi.mocked(clearNewsletterPauseAction).mockResolvedValueOnce({
            outcome: ACTION_OUTCOME.SERVER_ERROR,
          }),
      },
      {
        failure: 'a request that never reaches the server',
        fail: () =>
          vi
            .mocked(clearNewsletterPauseAction)
            .mockRejectedValueOnce(MOCK_UNREACHED_REQUEST),
      },
    ])(
      'keeps the dialog open with the error for $failure',
      async ({ fail }) => {
        fail();

        const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
        await user.click(confirm);

        const error = await screen.findByText(newsletterPauseCard.clearFailed);
        const dialog = screen.getByRole('alertdialog', DIALOG);

        expect(error).toBeVisible();
        expect(dialog).toBeVisible();
        expect(refresh).not.toHaveBeenCalled();
      },
    );

    it('says the pause was already cleared and refreshes the page', async () => {
      vi.mocked(clearNewsletterPauseAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_PAUSE_REFUSAL.NOT_PAUSED,
      });

      const confirm = await screen.findByRole('button', CONFIRM_BUTTON);
      await user.click(confirm);

      const error = await screen.findByText(newsletterPauseCard.alreadyCleared);

      expect(error).toBeVisible();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
