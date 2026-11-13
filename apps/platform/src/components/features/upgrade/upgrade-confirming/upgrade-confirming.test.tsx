import { UPGRADE_POLL, UPGRADE_STATE } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import { getUpgradeStateAction } from '@platform/server/billing/get-upgrade-state-action';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { Mock } from 'vitest';

import { UpgradeConfirming } from './upgrade-confirming';

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/billing/get-upgrade-state-action');

const { upgradePage } = messages;
const getStateMock = vi.mocked(getUpgradeStateAction);

const setup = customRender(UpgradeConfirming, {
  tenantId: MOCK_TENANT_ID,
  initialState: UPGRADE_STATE.AVAILABLE,
});

const advancePoll = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(UPGRADE_POLL.INTERVAL_MS);
  });
};

describe(`<${UpgradeConfirming.name}/>`, () => {
  let refresh: Mock;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    ({ refresh } = mockLocaleRouter());
    setup();
    getStateMock.mockResolvedValue(UPGRADE_STATE.AVAILABLE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says the payment is being confirmed', () => {
    const title = screen.getByText(upgradePage.confirmingTitle);

    expect(title).toBeVisible();
  });

  it('keeps checking without reloading while the plan has not changed', async () => {
    await advancePoll();
    await advancePoll();

    expect(getStateMock).toHaveBeenCalledTimes(2);
    expect(getStateMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reloads the page once the site is on Growth and stops checking', async () => {
    getStateMock.mockResolvedValueOnce(UPGRADE_STATE.ON_GROWTH);

    await advancePoll();
    await advancePoll();

    expect(refresh).toHaveBeenCalledOnce();
    expect(getStateMock).toHaveBeenCalledOnce();
  });
});
