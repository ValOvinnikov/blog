import type { Mock } from 'vitest';

import { withMinimumDuration } from './with-minimum-duration';

const MOCK_MINIMUM_MS = 1000;
const MOCK_RESULT = 'sent';

describe(withMinimumDuration, () => {
  let onSettled: Mock<(value: unknown) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    onSettled = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves only once the minimum duration has passed', async () => {
    void withMinimumDuration(MOCK_MINIMUM_MS, async () => MOCK_RESULT).then(
      onSettled,
    );
    await vi.advanceTimersByTimeAsync(MOCK_MINIMUM_MS - 1);

    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(onSettled).toHaveBeenCalledWith(MOCK_RESULT);
  });

  it('adds no wait to a task that already took longer', async () => {
    const slowTask = () =>
      new Promise<string>((resolve) =>
        setTimeout(() => resolve(MOCK_RESULT), MOCK_MINIMUM_MS * 2),
      );

    void withMinimumDuration(MOCK_MINIMUM_MS, slowTask).then(onSettled);
    await vi.advanceTimersByTimeAsync(MOCK_MINIMUM_MS * 2);

    expect(onSettled).toHaveBeenCalledWith(MOCK_RESULT);
  });

  it('holds back a failure for the same minimum duration', async () => {
    const failure = new Error('send failed');

    void withMinimumDuration(MOCK_MINIMUM_MS, () =>
      Promise.reject(failure),
    ).catch(onSettled);
    await vi.advanceTimersByTimeAsync(MOCK_MINIMUM_MS - 1);

    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(onSettled).toHaveBeenCalledWith(failure);
  });
});
