import { ACTION_OUTCOME } from '@blog/config';
import { CUSTOM_DOMAIN_REFUSAL } from '@platform/constants/custom-domain';
import { act, renderHookWithIntl } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { useVerifyCustomDomain } from './use-verify-custom-domain';

const VERIFY_POLL_INTERVAL_MS = 15000;
const VERIFY_POLL_MAX_TICKS = 40;

const { verifyCustomDomainActionMock, requestFocusMock } = vi.hoisted(() => ({
  verifyCustomDomainActionMock: vi.fn(),
  requestFocusMock: vi.fn(),
}));

vi.mock('@platform/server/custom-domain/verify-custom-domain-action', () => ({
  verifyCustomDomainAction: verifyCustomDomainActionMock,
}));

vi.mock(
  '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus',
  () => ({
    useCustomDomainFocus: () => ({
      registerHeading: vi.fn(),
      requestFocus: requestFocusMock,
    }),
  }),
);

const refused = (reason: string) => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe(useVerifyCustomDomain, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    vi.useFakeTimers();
    refresh = mockRouterRefresh();
    verifyCustomDomainActionMock.mockReset();
    requestFocusMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes and requests focus when a poll verifies the claim', async () => {
    verifyCustomDomainActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    renderHookWithIntl(() => useVerifyCustomDomain(MOCK_TENANT_ID));

    await advance(VERIFY_POLL_INTERVAL_MS);

    expect(verifyCustomDomainActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(requestFocusMock).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();

    await advance(VERIFY_POLL_INTERVAL_MS * 3);
    expect(verifyCustomDomainActionMock).toHaveBeenCalledOnce();
  });

  it.each([
    refused(CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND),
    { outcome: ACTION_OUTCOME.SERVER_ERROR },
  ])('keeps polling without refreshing on %j', async (result) => {
    verifyCustomDomainActionMock.mockResolvedValue(result);
    renderHookWithIntl(() => useVerifyCustomDomain(MOCK_TENANT_ID));

    await advance(VERIFY_POLL_INTERVAL_MS * 3);

    expect(verifyCustomDomainActionMock).toHaveBeenCalledTimes(3);
    expect(refresh).not.toHaveBeenCalled();
    expect(requestFocusMock).not.toHaveBeenCalled();
  });

  it.each([
    CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM,
    CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    CUSTOM_DOMAIN_REFUSAL.NOT_FOUND,
  ])('stops and refreshes when the poll settles on %s', async (reason) => {
    verifyCustomDomainActionMock.mockResolvedValue(refused(reason));
    renderHookWithIntl(() => useVerifyCustomDomain(MOCK_TENANT_ID));

    await advance(VERIFY_POLL_INTERVAL_MS);
    await advance(VERIFY_POLL_INTERVAL_MS * 3);

    expect(verifyCustomDomainActionMock).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
    expect(requestFocusMock).not.toHaveBeenCalled();
  });

  it('stops polling after its tick cap while the record is not found', async () => {
    verifyCustomDomainActionMock.mockResolvedValue(
      refused(CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND),
    );
    renderHookWithIntl(() => useVerifyCustomDomain(MOCK_TENANT_ID));

    await advance(VERIFY_POLL_INTERVAL_MS * (VERIFY_POLL_MAX_TICKS + 5));

    expect(verifyCustomDomainActionMock).toHaveBeenCalledTimes(
      VERIFY_POLL_MAX_TICKS,
    );
  });
});
