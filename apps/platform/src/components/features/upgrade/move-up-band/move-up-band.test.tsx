import { MoveUpBand } from '@platform/components/features/upgrade/move-up-band';
import { UPGRADE_POLL } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
} from '@platform/constants/plan-change';
import { getMoveUpQuoteAction } from '@platform/server/billing/get-move-up-quote-action';
import { getTenantBandAction } from '@platform/server/billing/get-tenant-band-action';
import { moveUpSubscriberBandAction } from '@platform/server/billing/move-up-band-action';
import type { TChangePlanResult } from '@platform/server/billing/plan-change-outcome';
import {
  MOCK_PAYMENT_CLIENT_SECRET,
  MOCK_STRIPE_PUBLISHABLE_KEY,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_CARD_LAST4,
  MOCK_MOVE_UP_OFFER,
  MOCK_MOVE_UP_QUOTE,
} from '@platform/testing/billing/move-up';
import {
  MOCK_BANK_STEP_CANCELLED,
  mockStripeNextAction,
} from '@platform/testing/billing/stripe-js';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@shinefold/config';
import { errorResult } from '@shinefold/utils';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/billing/move-up-band-action');

vi.mock('@platform/server/billing/get-move-up-quote-action');

vi.mock('@platform/server/billing/get-tenant-band-action');

vi.mock('@stripe/stripe-js');

const t = makeEnTranslator('moveUpBand');
const tUpgrade = makeEnTranslator('upgradePage');
const amount = (value: Parameters<typeof formatStripeAmount>[0]) =>
  formatStripeAmount(value, LOCALE_ISO_CODES.EN);

const { ceiling, allowance, interval, extra } = MOCK_MOVE_UP_OFFER;
const TRIGGER_LABEL = t('trigger', { ceiling, interval, price: amount(extra) });
const PAY_LABEL = t('pay', { amount: amount(MOCK_MOVE_UP_QUOTE.dueToday) });

const setup = customRender(MoveUpBand, {
  tenantId: MOCK_TENANT_ID,
  offer: MOCK_MOVE_UP_OFFER,
  publishableKey: MOCK_STRIPE_PUBLISHABLE_KEY,
});

describe(`<${MoveUpBand.name}/>`, () => {
  let user: UserEvent;
  let push: Mock;

  const openDialog = async () => {
    const trigger = screen.getByRole('button', { name: TRIGGER_LABEL });
    await user.click(trigger);
  };

  beforeEach(() => {
    user = userEvent.setup();
    ({ push } = mockLocaleRouter());
    setup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers the next band at its extra price', () => {
    const trigger = screen.getByRole('button', { name: TRIGGER_LABEL });

    expect(trigger).toBeVisible();
    expect(getMoveUpQuoteAction).not.toHaveBeenCalled();
  });

  describe('once opened', () => {
    let pay: HTMLElement;
    let cancel: HTMLElement;

    beforeEach(async () => {
      await openDialog();
      pay = await screen.findByRole('button', { name: PAY_LABEL });
      cancel = screen.getByRole('button', { name: t('cancel') });
    });

    it('shows limits, charge, renewal, card and move-down rule before paying', () => {
      const dialog = screen.getByRole('alertdialog', {
        name: t('title', { ceiling }),
      });
      const limits = screen.getByText(t('newLimits', { ceiling, allowance }));
      const dueToday = screen.getByText(amount(MOCK_MOVE_UP_QUOTE.dueToday));
      const renewalTerm = screen.getByText(
        t('renewalTerm', {
          date: formatDate(MOCK_MOVE_UP_QUOTE.renewsAt, LOCALE_ISO_CODES.EN),
        }),
      );
      const renewalTotal = screen.getByText(
        t('renewalTotal', {
          interval,
          total: amount(MOCK_MOVE_UP_QUOTE.total),
        }),
      );
      const card = screen.getByText(new RegExp(MOCK_CARD_LAST4));
      const moveDownNote = screen.getByText(t('moveDownNote'));

      expect(dialog).toBeVisible();
      expect(limits).toBeVisible();
      expect(dueToday).toBeVisible();
      expect(renewalTerm).toBeVisible();
      expect(renewalTotal).toBeVisible();
      expect(card).toBeVisible();
      expect(moveDownNote).toBeVisible();
      expect(getMoveUpQuoteAction).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        { ceiling },
      );
      expect(moveUpSubscriberBandAction).not.toHaveBeenCalled();
    });

    it('focuses Cancel', async () => {
      await act(() => vi.waitFor(() => expect(cancel).toHaveFocus()));
    });

    describe('after Cancel', () => {
      beforeEach(async () => {
        await user.click(cancel);
      });

      it('closes without charging', () => {
        const dialog = screen.queryByRole('alertdialog');

        expect(dialog).not.toBeInTheDocument();
        expect(moveUpSubscriberBandAction).not.toHaveBeenCalled();
      });

      it('fetches a fresh quote when opened again', async () => {
        await openDialog();
        await screen.findByRole('button', { name: PAY_LABEL });

        expect(getMoveUpQuoteAction).toHaveBeenCalledTimes(2);
      });
    });

    it('closes on the escape key without charging', async () => {
      await user.keyboard(USER_EVENT_KEY.ESCAPE);

      const dialog = screen.queryByRole('alertdialog');

      expect(dialog).not.toBeInTheDocument();
      expect(moveUpSubscriberBandAction).not.toHaveBeenCalled();
    });

    it('stays open and ignores the escape key while paying', async () => {
      const payment = Promise.withResolvers<TChangePlanResult>();
      vi.mocked(moveUpSubscriberBandAction).mockReturnValueOnce(
        payment.promise,
      );

      await user.click(pay);
      await user.keyboard(USER_EVENT_KEY.ESCAPE);
      const dialog = screen.getByRole('alertdialog');

      expect(dialog).toBeVisible();
      expect(cancel).toBeDisabled();
      await act(async () => {
        payment.resolve({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      });
    });

    it('shows a declined card inside the dialog and changes nothing', async () => {
      vi.mocked(moveUpSubscriberBandAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
      });

      await user.click(pay);
      const alert = await screen.findByRole('alert');
      const dialog = screen.getByRole('alertdialog');

      expect(alert).toHaveTextContent(
        tUpgrade(PLAN_CHANGE_REFUSAL.CARD_DECLINED),
      );
      expect(dialog).toBeVisible();
      expect(push).not.toHaveBeenCalled();
    });

    it('shows an unfinished bank step inside the dialog', async () => {
      mockStripeNextAction().mockResolvedValue(MOCK_BANK_STEP_CANCELLED);
      vi.mocked(moveUpSubscriberBandAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
        timing: PLAN_CHANGE_TIMING.NOW,
        clientSecret: MOCK_PAYMENT_CLIENT_SECRET,
      });

      await user.click(pay);
      const notice = await screen.findByText(
        tUpgrade(PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED),
      );

      expect(notice).toBeVisible();
      expect(push).not.toHaveBeenCalled();
    });

    it('shows an unknown result inside the dialog', async () => {
      vi.mocked(moveUpSubscriberBandAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(pay);
      const notice = await screen.findByText(tUpgrade('changeFailed'));

      expect(notice).toBeVisible();
    });

    it('waits for the stored band, then goes to Subscribers flagged', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

      await user.click(pay);
      const confirming = await screen.findByText(
        tUpgrade('changeConfirmingTitle'),
      );

      expect(moveUpSubscriberBandAction).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        { ceiling, prorationDate: MOCK_MOVE_UP_QUOTE.prorationDate },
      );
      expect(confirming).toBeVisible();
      expect(push).not.toHaveBeenCalled();

      vi.mocked(getTenantBandAction).mockResolvedValue(ceiling);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(UPGRADE_POLL.INTERVAL_MS);
      });

      expect(push).toHaveBeenCalledExactlyOnceWith(
        adminRoutes.dashboardSubscribersMovedUp(ceiling),
      );
    });
  });

  it('can be closed once the wait for the new band runs out', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await openDialog();
    const pay = await screen.findByRole('button', { name: PAY_LABEL });
    await user.click(pay);
    await screen.findByText(tUpgrade('changeConfirmingTitle'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        UPGRADE_POLL.INTERVAL_MS * UPGRADE_POLL.MAX_TICKS,
      );
    });
    await user.keyboard(USER_EVENT_KEY.ESCAPE);
    const dialog = screen.queryByRole('alertdialog');

    expect(dialog).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('explains a price that cannot be loaded, with nothing to pay', async () => {
    vi.mocked(getMoveUpQuoteAction).mockResolvedValueOnce(
      errorResult(undefined),
    );

    await openDialog();
    const notice = await screen.findByText(t('quoteFailed'));
    const pay = screen.queryByRole('button', { name: PAY_LABEL });

    expect(notice).toBeVisible();
    expect(pay).not.toBeInTheDocument();
  });
});
