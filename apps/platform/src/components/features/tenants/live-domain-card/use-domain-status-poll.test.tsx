import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { act, renderHook } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { useDomainStatusPoll } from './use-domain-status-poll';

const DOMAIN_POLL_INTERVAL_MS = 10000;
const DOMAIN_POLL_MAX_TICKS = 30;

const { getDomainVerificationStatusActionMock } = vi.hoisted(() => ({
  getDomainVerificationStatusActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: getDomainVerificationStatusActionMock,
  }),
);

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe(useDomainStatusPoll, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getDomainVerificationStatusActionMock.mockReset();
    getDomainVerificationStatusActionMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns each status the poll fetches for the tenant', async () => {
    const { result } = renderHook(() =>
      useDomainStatusPoll(MOCK_TENANT_ID, DOMAIN_VERIFICATION_STATUS.NOT_ADDED),
    );
    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.NOT_ADDED);

    await advance(DOMAIN_POLL_INTERVAL_MS);
    expect(getDomainVerificationStatusActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.PENDING);

    getDomainVerificationStatusActionMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.ERROR,
    );
    await advance(DOMAIN_POLL_INTERVAL_MS);
    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
  ])('never polls a domain that starts %s', async (status) => {
    renderHook(() => useDomainStatusPoll(MOCK_TENANT_ID, status));

    await advance(DOMAIN_POLL_INTERVAL_MS * 3);

    expect(getDomainVerificationStatusActionMock).not.toHaveBeenCalled();
  });

  it('stops polling once a final status arrives', async () => {
    getDomainVerificationStatusActionMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    const { result } = renderHook(() =>
      useDomainStatusPoll(MOCK_TENANT_ID, DOMAIN_VERIFICATION_STATUS.PENDING),
    );

    await advance(DOMAIN_POLL_INTERVAL_MS);
    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);

    await advance(DOMAIN_POLL_INTERVAL_MS * 3);
    expect(getDomainVerificationStatusActionMock).toHaveBeenCalledOnce();
  });

  it('stops polling at its tick cap while the status stays unsettled', async () => {
    renderHook(() =>
      useDomainStatusPoll(MOCK_TENANT_ID, DOMAIN_VERIFICATION_STATUS.PENDING),
    );

    await advance(DOMAIN_POLL_INTERVAL_MS * (DOMAIN_POLL_MAX_TICKS + 5));

    expect(getDomainVerificationStatusActionMock).toHaveBeenCalledTimes(
      DOMAIN_POLL_MAX_TICKS,
    );
  });

  it('sends nothing while the tab is hidden and resumes once it is visible', async () => {
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');
    renderHook(() =>
      useDomainStatusPoll(MOCK_TENANT_ID, DOMAIN_VERIFICATION_STATUS.PENDING),
    );

    await advance(DOMAIN_POLL_INTERVAL_MS * 3);
    expect(getDomainVerificationStatusActionMock).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    await advance(DOMAIN_POLL_INTERVAL_MS);
    expect(getDomainVerificationStatusActionMock).toHaveBeenCalledOnce();
  });

  it('keeps polling after a rejected request', async () => {
    getDomainVerificationStatusActionMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );
    const { result } = renderHook(() =>
      useDomainStatusPoll(MOCK_TENANT_ID, DOMAIN_VERIFICATION_STATUS.PENDING),
    );

    await advance(DOMAIN_POLL_INTERVAL_MS);
    getDomainVerificationStatusActionMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    await advance(DOMAIN_POLL_INTERVAL_MS);

    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });

  it('adopts a fresh starting status from the server', () => {
    const { result, rerender } = renderHook(
      ({ status }) => useDomainStatusPoll(MOCK_TENANT_ID, status),
      {
        initialProps: {
          status:
            DOMAIN_VERIFICATION_STATUS.PENDING as TDomainVerificationStatus,
        },
      },
    );

    rerender({ status: DOMAIN_VERIFICATION_STATUS.VERIFIED });

    expect(result.current).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });
});
