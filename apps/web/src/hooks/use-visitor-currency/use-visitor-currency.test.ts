/**
 * @vitest-environment jsdom
 */
import { HTTP_STATUS } from '@shinefold/config';
import { BILLING_CURRENCY } from '@shinefold/db/constants';
import { PRICING_LOG } from '@web/constants/pricing';
import { renderHook, waitFor } from '@web/testing/custom-render';
import { VISITOR_CURRENCY_PATH } from '@web/utils/visitor-currency';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const DEFAULT_CURRENCY = BILLING_CURRENCY.USD;

const respondWith = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

const neverRespondUntilAborted = () =>
  vi.fn(
    (_path: string, { signal }: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal.reason));
      }),
  );

const loadHook = async () => {
  vi.resetModules();
  const { useVisitorCurrency } = await import('./use-visitor-currency');
  return () => renderHook(() => useVisitorCurrency(DEFAULT_CURRENCY));
};

describe('useVisitorCurrency', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is undefined until the currency is known, then the answered one', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith(HTTP_STATUS.OK, { currency: BILLING_CURRENCY.EUR }),
    );
    const render = await loadHook();

    const { result } = render();

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(BILLING_CURRENCY.EUR));
  });

  it('falls back to the default currency for a country with none', async () => {
    vi.stubGlobal('fetch', respondWith(HTTP_STATUS.OK));
    const render = await loadHook();

    const { result } = render();

    await waitFor(() => expect(result.current).toBe(DEFAULT_CURRENCY));
    expect(reportClientErrorMock).not.toHaveBeenCalled();
  });

  it('makes one request however many cards ask', async () => {
    const fetchMock = respondWith(HTTP_STATUS.OK, {
      currency: BILLING_CURRENCY.GBP,
    });
    vi.stubGlobal('fetch', fetchMock);
    const render = await loadHook();

    const first = render();
    const second = render();

    await waitFor(() =>
      expect(first.result.current).toBe(BILLING_CURRENCY.GBP),
    );
    await waitFor(() =>
      expect(second.result.current).toBe(BILLING_CURRENCY.GBP),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      VISITOR_CURRENCY_PATH,
      expect.anything(),
    );
  });

  it('reports a failed lookup and falls back to the default currency', async () => {
    vi.stubGlobal('fetch', respondWith(HTTP_STATUS.INTERNAL_SERVER_ERROR));
    const render = await loadHook();

    const { result } = render();

    await waitFor(() => expect(result.current).toBe(DEFAULT_CURRENCY));
    expect(reportClientErrorMock).toHaveBeenCalledWith(
      PRICING_LOG.VISITOR_CURRENCY_FETCH_FAILED,
      expect.any(Error),
    );
  });

  it('gives up on a slow lookup and falls back to the default currency', async () => {
    const timeout = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal);
    vi.stubGlobal('fetch', neverRespondUntilAborted());
    const render = await loadHook();

    const { result } = render();
    expect(result.current).toBeUndefined();
    timeout.abort();

    await waitFor(() => expect(result.current).toBe(DEFAULT_CURRENCY));
  });
});
