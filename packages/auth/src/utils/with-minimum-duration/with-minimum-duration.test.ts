import { withMinimumDuration } from './with-minimum-duration';

const MINIMUM_MS = 1000;
const RESULT = 'sent';

describe(withMinimumDuration, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves only once the minimum duration has passed', async () => {
    const onSettled = vi.fn();

    void withMinimumDuration(MINIMUM_MS, async () => RESULT).then(onSettled);
    await vi.advanceTimersByTimeAsync(MINIMUM_MS - 1);

    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(onSettled).toHaveBeenCalledWith(RESULT);
  });

  it('adds no wait to a task that already took longer', async () => {
    const onSettled = vi.fn();
    const slowTask = () =>
      new Promise<string>((resolve) =>
        setTimeout(() => resolve(RESULT), MINIMUM_MS * 2),
      );

    void withMinimumDuration(MINIMUM_MS, slowTask).then(onSettled);
    await vi.advanceTimersByTimeAsync(MINIMUM_MS * 2);

    expect(onSettled).toHaveBeenCalledWith(RESULT);
  });

  it('holds back a failure for the same minimum duration', async () => {
    const failure = new Error('send failed');
    const onRejected = vi.fn();

    void withMinimumDuration(MINIMUM_MS, () => Promise.reject(failure)).catch(
      onRejected,
    );
    await vi.advanceTimersByTimeAsync(MINIMUM_MS - 1);

    expect(onRejected).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(onRejected).toHaveBeenCalledWith(failure);
  });
});
