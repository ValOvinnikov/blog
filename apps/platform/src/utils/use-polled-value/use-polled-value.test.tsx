import type { TMaybeUndefined } from '@blog/config';
import { act, renderHook } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { usePolledValue, type TPolledValueOptions } from './use-polled-value';

const INITIAL_VALUE = 'initial';
const POLLED_VALUE = 'polled';
const FINAL_VALUE = 'final';

const pollMock = vi.fn<(key: string) => Promise<TMaybeUndefined<string>>>();
const onErrorMock = vi.fn();

const OPTIONS: TPolledValueOptions<string> = {
  intervalMs: 1000,
  maxTicks: 3,
  isActive: (value) => value !== FINAL_VALUE,
};

const advanceTicks = async (ticks: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(OPTIONS.intervalMs * ticks);
  });
};

const renderPoll = (options: TPolledValueOptions<string> = OPTIONS) =>
  renderHook(() =>
    usePolledValue(MOCK_TENANT_ID, INITIAL_VALUE, pollMock, options),
  );

describe(usePolledValue, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pollMock.mockReset();
    onErrorMock.mockReset();
    pollMock.mockResolvedValue(POLLED_VALUE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls with its key and returns each result', async () => {
    const { result } = renderPoll();

    await advanceTicks(1);

    expect(pollMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(result.current.value).toBe(POLLED_VALUE);
  });

  it('stops once the caller is no longer active', async () => {
    pollMock.mockResolvedValue(FINAL_VALUE);
    renderPoll();

    await advanceTicks(1);
    await advanceTicks(2);

    expect(pollMock).toHaveBeenCalledOnce();
  });

  it('keeps the last value when a poll resolves to nothing', async () => {
    pollMock.mockResolvedValue(undefined);
    const { result } = renderPoll();

    await advanceTicks(1);

    expect(result.current.value).toBe(INITIAL_VALUE);
  });

  it('reports a rejected poll to the caller and keeps polling', async () => {
    pollMock.mockRejectedValueOnce(new Error());
    const { result } = renderPoll({ ...OPTIONS, onError: onErrorMock });

    await advanceTicks(2);

    expect(onErrorMock).toHaveBeenCalledOnce();
    expect(result.current.value).toBe(POLLED_VALUE);
  });

  it('polls again after a restart once it has reached its cap', async () => {
    const { result } = renderPoll();

    await advanceTicks(OPTIONS.maxTicks + 2);
    act(() => {
      result.current.restart();
    });
    await advanceTicks(1);

    expect(pollMock).toHaveBeenCalledTimes(OPTIONS.maxTicks + 1);
  });
});
