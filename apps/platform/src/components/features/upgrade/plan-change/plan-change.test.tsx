import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { BILLING_INTERVAL, UPGRADE_POLL } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import messages from '@platform/i18n/messages/en.json';
import { changePlanAction } from '@platform/server/billing/change-plan-action';
import { getTenantPlanAction } from '@platform/server/billing/get-tenant-plan-action';
import { MOCK_RENEWS_AT } from '@platform/testing/billing/plan-subscription';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { PlanChange } from './plan-change';

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/billing/change-plan-action');

vi.mock('@platform/server/billing/get-tenant-plan-action');

const { upgradePage, planNames } = messages;
const t = makeEnTranslator('upgradePage');

const STARTER_MONTHLY: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.MONTHLY,
};
const GROWTH_MONTHLY: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};

const setup = customRender(PlanChange, {
  tenantId: MOCK_TENANT_ID,
  current: STARTER_MONTHLY,
  renewsAt: MOCK_RENEWS_AT,
  pending: undefined,
});

const submitButton = () =>
  screen.getByRole('button', { name: upgradePage.changeSubmit });

const choose = async (user: UserEvent, name: string) => {
  const option = screen.getByRole('button', { name });
  await user.click(option);
};

describe(`<${PlanChange.name}/>`, () => {
  let user: UserEvent;
  let refresh: Mock;

  beforeEach(() => {
    user = userEvent.setup();
    ({ refresh } = mockLocaleRouter());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('on Starter, paid monthly', () => {
    beforeEach(() => {
      setup();
    });

    it('shows the current plan with nothing to change yet', () => {
      const current = screen.getByText(
        t('currentPlan', {
          plan: planNames.STARTER,
          interval: BILLING_INTERVAL.MONTHLY,
        }),
      );
      const submit = submitButton();

      expect(current).toBeVisible();
      expect(submit).toBeDisabled();
    });

    it('links to Billing', () => {
      const billing = screen.getByRole('link', {
        name: upgradePage.billingLink,
      });

      expect(billing).toHaveAttribute('href', adminRoutes.dashboardBilling());
    });

    it('says a move up starts today', async () => {
      await choose(user, planNames.GROWTH);
      const summary = screen.getByText(upgradePage.changeNow);
      const submit = submitButton();

      expect(summary).toBeVisible();
      expect(submit).toBeEnabled();
    });

    it('moves up now and waits for the webhook before refreshing', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

      await choose(user, planNames.GROWTH);
      await user.click(submitButton());
      const confirming = await screen.findByText(
        upgradePage.changeConfirmingTitle,
      );

      expect(changePlanAction).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        GROWTH_MONTHLY,
      );
      expect(confirming).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();

      vi.mocked(getTenantPlanAction).mockResolvedValue(TENANT_PLAN.GROWTH);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(UPGRADE_POLL.INTERVAL_MS);
      });

      expect(refresh).toHaveBeenCalledOnce();
    });

    it('explains a refusal', async () => {
      vi.mocked(changePlanAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
      });

      await choose(user, planNames.GROWTH);
      await user.click(submitButton());
      const refusal = await screen.findByText(upgradePage.CARD_DECLINED);

      expect(refusal).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });

    it('says the change failed on a server error', async () => {
      vi.mocked(changePlanAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await choose(user, planNames.GROWTH);
      await user.click(submitButton());
      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(upgradePage.changeFailed);
    });
  });

  it('moves down at renewal and refreshes to show the planned change', async () => {
    vi.mocked(changePlanAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.AT_RENEWAL,
    });
    setup({ current: GROWTH_MONTHLY });

    await choose(user, planNames.STARTER);
    await user.click(submitButton());

    expect(changePlanAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      STARTER_MONTHLY,
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('offers to keep the current plan while a change is planned', async () => {
    setup({
      current: GROWTH_MONTHLY,
      pending: { ...STARTER_MONTHLY, startsAt: MOCK_RENEWS_AT },
    });

    const note = screen.getByRole('note');
    const keep = screen.getByRole('button', {
      name: t('keepCurrent', { plan: planNames.GROWTH }),
    });
    await user.click(keep);

    expect(note).toHaveTextContent(planNames.STARTER);
    expect(changePlanAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      GROWTH_MONTHLY,
    );
  });
});
