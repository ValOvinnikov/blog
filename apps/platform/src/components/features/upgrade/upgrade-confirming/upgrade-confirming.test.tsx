import {
  type TUpgradeState,
  UPGRADE_POLL,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import { getUpgradeStateAction } from '@platform/server/billing/get-upgrade-state-action';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  changeDocumentVisibility,
  DOCUMENT_HIDDEN,
  DOCUMENT_VISIBLE,
} from '@platform/testing/document-visibility';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { fireEvent } from '@testing-library/react';
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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('says the payment is being confirmed in one status region', () => {
    const status = screen.getByRole('status');

    expect(status).toHaveTextContent(upgradePage.confirmingTitle);
  });

  it('keeps checking without reloading while the plan has not changed', async () => {
    await advancePoll();
    await advancePoll();

    expect(getStateMock).toHaveBeenCalledTimes(2);
    expect(getStateMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('announces the confirmed payment in the same region and reloads once', async () => {
    getStateMock.mockResolvedValueOnce(UPGRADE_STATE.SUBSCRIBED);

    await advancePoll();
    await advancePoll();

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(upgradePage.confirmedTitle);
    expect(refresh).toHaveBeenCalledOnce();
    expect(getStateMock).toHaveBeenCalledOnce();
  });

  it('says it is taking longer when a check fails', async () => {
    getStateMock.mockRejectedValueOnce(new Error());

    await advancePoll();

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(upgradePage.slowTitle);
  });

  describe('once every check has run without a change', () => {
    beforeEach(async () => {
      for (let tick = 0; tick < UPGRADE_POLL.MAX_TICKS; tick += 1) {
        await advancePoll();
      }
    });

    it('says it is taking longer than usual', () => {
      const status = screen.getByRole('status');

      expect(status).toHaveTextContent(upgradePage.slowTitle);
    });

    it('checks again and reloads from Check again', async () => {
      const checkAgain = screen.getByRole('button', {
        name: upgradePage.checkAgain,
      });

      fireEvent.click(checkAgain);
      await advancePoll();

      const status = screen.getByRole('status');
      expect(refresh).toHaveBeenCalledOnce();
      expect(getStateMock).toHaveBeenCalledTimes(UPGRADE_POLL.MAX_TICKS + 1);
      expect(status).toHaveTextContent(upgradePage.confirmingTitle);
    });
  });

  it('says it is taking longer when a check is dropped while the tab is hidden', async () => {
    let resolveHiddenCheck: (state: TUpgradeState) => void = () => undefined;
    getStateMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveHiddenCheck = resolve;
        }),
    );

    await advancePoll();
    changeDocumentVisibility(DOCUMENT_HIDDEN);
    resolveHiddenCheck(UPGRADE_STATE.AVAILABLE);
    changeDocumentVisibility(DOCUMENT_VISIBLE);
    for (let tick = 1; tick < UPGRADE_POLL.MAX_TICKS; tick += 1) {
      await advancePoll();
    }

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(upgradePage.slowTitle);
  });
});
