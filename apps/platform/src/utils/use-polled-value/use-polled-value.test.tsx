import type { TMaybeUndefined } from '@blog/config';
import { act, renderHook } from '@platform/testing/custom-render';
import {
  changeDocumentVisibility,
  DOCUMENT_HIDDEN,
  DOCUMENT_VISIBLE,
} from '@platform/testing/document-visibility';
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
    vi.restoreAllMocks();
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

  it('is out of checks after its cap even when a check is dropped while hidden', async () => {
    let resolveHiddenCheck: (value: string) => void = () => undefined;
    pollMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveHiddenCheck = resolve;
        }),
    );
    const { result } = renderPoll();

    await advanceTicks(1);
    changeDocumentVisibility(DOCUMENT_HIDDEN);
    resolveHiddenCheck(POLLED_VALUE);
    changeDocumentVisibility(DOCUMENT_VISIBLE);
    await advanceTicks(OPTIONS.maxTicks);

    expect(result.current.isExhausted).toBe(true);
  });

  describe('with the default options', () => {
    let result: ReturnType<typeof renderPoll>['result'];

    beforeEach(() => {
      ({ result } = renderPoll());
    });

    it('polls with its key and returns each result', async () => {
      await advanceTicks(1);

      expect(pollMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(result.current.value).toBe(POLLED_VALUE);
    });

    it('polls again after a restart once it has reached its cap', async () => {
      await advanceTicks(OPTIONS.maxTicks + 2);
      act(() => {
        result.current.restart();
      });
      await advanceTicks(1);

      expect(pollMock).toHaveBeenCalledTimes(OPTIONS.maxTicks + 1);
    });

    describe('once it has reached its cap', () => {
      beforeEach(async () => {
        await advanceTicks(OPTIONS.maxTicks);
      });

      it('reports it is out of checks', () => {
        expect(result.current.isExhausted).toBe(true);
      });

      it('has checks left again after a restart', () => {
        act(() => {
          result.current.restart();
        });

        expect(result.current.isExhausted).toBe(false);
      });
    });
  });
});
