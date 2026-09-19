import { TOAST_TYPE, type TToastType } from '@blog/config';

import { createToastStore, type IToastPayload } from './toast-store';

const buildPayload = (overrides?: Partial<IToastPayload>): IToastPayload => ({
  title: 'Bookmark',
  message: 'Saved to bookmarks',
  ...overrides,
});

const measureDefaultLifeMs = (type: TToastType): number => {
  const probe = createToastStore();
  const start = Date.now();
  probe.actions.show(type, buildPayload());
  vi.advanceTimersToNextTimer();
  const elapsed = Date.now() - start;
  probe.destroy();
  return elapsed;
};

const DISCOVERY_CEILING = 100;

const discoverQueueCap = (): number => {
  const probe = createToastStore();
  let previousVisibleCount = -1;
  let i = 0;
  for (
    ;
    i < DISCOVERY_CEILING &&
    probe.getState().visible.length !== previousVisibleCount;
    i++
  ) {
    previousVisibleCount = probe.getState().visible.length;
    probe.actions.show(
      TOAST_TYPE.INFO,
      buildPayload({ message: `probe-${previousVisibleCount}` }),
    );
  }
  probe.destroy();
  if (i >= DISCOVERY_CEILING) {
    throw new Error(
      `discoverQueueCap did not stabilize within ${DISCOVERY_CEILING} pushes`,
    );
  }
  return previousVisibleCount;
};

const fillVisibleToCap = (
  store: ReturnType<typeof createToastStore>,
  type: TToastType,
  cap: number,
): string[] =>
  Array.from({ length: cap }, (_, i) =>
    store.actions.show(type, buildPayload({ message: `msg-${i}` })),
  );

const createLoadingToast = async () => {
  const store = createToastStore();
  let resolvePromise!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  store.actions.promise(pending, {
    loading: { title: 'Saving', message: 'saving…' },
    success: { title: 'Saved', message: 'saved' },
    error: { title: 'Failed', message: 'failed' },
  });

  await vi.advanceTimersToNextTimerAsync();
  const loadingId = store.getState().visible[0]!.id;

  return { store, resolvePromise, loadingId };
};

describe(createToastStore, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show', () => {
    it('enqueues a new toast in the entering phase with a numeric life', () => {
      const store = createToastStore();

      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        id,
        type: TOAST_TYPE.SUCCESS,
        title: 'Bookmark',
        message: 'Saved to bookmarks',
        phase: 'entering',
        paused: false,
      });
      expect(store.getState().visible[0]!.durationMs).toEqual(
        expect.any(Number),
      );
    });

    it('gives warning a longer life than success and leaves error sticky', () => {
      const warningLifeMs = measureDefaultLifeMs(TOAST_TYPE.WARNING);
      const successLifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      expect(warningLifeMs).toBeGreaterThan(successLifeMs);
      expect(store.getState().visible[0]!.durationMs).toBeUndefined();
    });

    it('honors an explicit durationMs override', () => {
      const store = createToastStore();

      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ durationMs: 1000 }),
      );

      expect(store.getState().visible[0]!.durationMs).toBe(1000);
    });

    it('auto-dismisses after its life elapses, entering leaving then removed', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      vi.advanceTimersToNextTimer();
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );

      vi.advanceTimersToNextTimer();
      expect(store.getState().visible.find((t) => t.id === id)).toBeUndefined();
    });

    it('never auto-dismisses an error toast', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      vi.runAllTimers();

      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
    });
  });

  describe('cap and eviction', () => {
    it('evicts the oldest non-error toast once one more than the cap is shown', () => {
      const store = createToastStore();
      const cap = discoverQueueCap();
      const ids = fillVisibleToCap(store, TOAST_TYPE.INFO, cap);

      const overflowId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({ message: 'msg-overflow' }),
      );

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).toHaveLength(cap);
      expect(visibleIds).not.toContain(ids[0]);
      expect(visibleIds).toContain(overflowId);
    });

    it('queues a new toast instead of evicting when every visible slot is an error', () => {
      const store = createToastStore();
      const cap = discoverQueueCap();
      fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);

      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      expect(store.getState().visible).toHaveLength(cap);
      expect(store.getState().visible.some((t) => t.id === queuedId)).toBe(
        false,
      );
      expect(store.getState().pending.map((t) => t.id)).toContain(queuedId);
    });

    it('promotes the oldest pending toast once a visible slot frees up', () => {
      const store = createToastStore();
      const cap = discoverQueueCap();
      const errorIds = fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(errorIds[0]);
      vi.advanceTimersToNextTimer();

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).toContain(queuedId);
      expect(store.getState().pending).toHaveLength(0);
    });
  });

  describe('coalescing', () => {
    it('toggle-collapse: a second call with the same coalesceKey replaces the toast in place', () => {
      const store = createToastStore();
      const key = 'bookmark:post-1';

      const firstId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'Saved', coalesceKey: key }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({ message: 'Removed', coalesceKey: key }),
      );

      expect(secondId).toBe(firstId);
      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.INFO,
        message: 'Removed',
      });
    });

    it('toggle-collapse resets the timer to the fresh full duration', () => {
      const lifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);
      const store = createToastStore();
      const key = 'bookmark:post-1';

      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );
      store.actions.markEntered(id);
      vi.advanceTimersByTime(lifeMs - 600);
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );

      vi.advanceTimersByTime(600);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'visible',
      );

      vi.advanceTimersByTime(lifeMs - 600);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );
    });

    it('counter-merge: identical success toasts within the merge window collapse with an incrementing count', () => {
      const store = createToastStore();

      const firstId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(100);
      const secondId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(100);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(secondId).toBe(firstId);
      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]!.count).toBe(3);
    });

    it('counter-merge while paused un-pauses and re-arms a fresh full-duration timer', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      store.actions.pause(id);
      expect(store.getState().visible[0]!.paused).toBe(true);

      const mergedId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      expect(mergedId).toBe(id);

      const merged = store.getState().visible.find((t) => t.id === id);
      expect(merged?.paused).toBe(false);
      expect(merged?.count).toBe(2);

      vi.advanceTimersToNextTimer();
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );
    });

    it('does not merge once a long delay has elapsed', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.setSystemTime(Date.now() + 60 * 60 * 1000);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(store.getState().visible).toHaveLength(2);
    });

    it('never merges error toasts, even when identical within the window', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.ERROR, buildPayload());
      store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      expect(store.getState().visible).toHaveLength(2);
      expect(store.getState().visible.every((t) => t.count === undefined)).toBe(
        true,
      );
    });
  });

  describe('pause / resume', () => {
    it('pauses the auto-dismiss timer and resumes from the exact remaining time', () => {
      const lifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      vi.advanceTimersByTime(1000);
      store.actions.pause(id);

      vi.advanceTimersByTime(lifeMs);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
      expect(store.getState().visible.find((t) => t.id === id)?.paused).toBe(
        true,
      );

      store.actions.resume(id);

      vi.advanceTimersByTime(lifeMs - 1000 - 1);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
      vi.advanceTimersByTime(2);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );
    });

    it('is a no-op to pause an already-paused toast or resume a running one', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.resume(id);
      expect(store.getState().visible.find((t) => t.id === id)?.paused).toBe(
        false,
      );

      store.actions.pause(id);
      store.actions.pause(id);
      expect(store.getState().visible.find((t) => t.id === id)?.paused).toBe(
        true,
      );
    });
  });

  describe('dismiss', () => {
    it('dismisses the given id', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.dismiss(id);
      vi.advanceTimersToNextTimer();

      expect(store.getState().visible).toHaveLength(0);
    });

    it('dismisses the newest toast when no id is given', () => {
      const store = createToastStore();
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'first' }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'second', coalesceKey: 'irrelevant' }),
      );

      store.actions.dismiss();
      vi.advanceTimersToNextTimer();

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).not.toContain(secondId);
      expect(store.getState().visible).toHaveLength(1);
    });

    it('removes a pending (not-yet-visible) toast without a leave animation', () => {
      const store = createToastStore();
      const cap = discoverQueueCap();
      fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(queuedId);

      expect(store.getState().pending).toHaveLength(0);
    });

    it('is a no-op when the queue is empty', () => {
      const store = createToastStore();

      expect(() => store.actions.dismiss()).not.toThrow();
    });
  });

  describe('markEntered', () => {
    it('flips an entering toast to visible', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.markEntered(id);

      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'visible',
      );
    });
  });

  describe('promise', () => {
    it('shows the resolved toast directly, skipping loading, when the promise settles before the grace period', async () => {
      const store = createToastStore();
      const deferred = Promise.resolve('~/bookmarks');

      const returned = store.actions.promise(deferred, {
        loading: { title: 'Saving', message: 'saving…' },
        success: (value) => ({
          title: 'Saved',
          message: `stashed to ${value}`,
        }),
        error: { title: 'Failed', message: '! failed' },
      });

      expect(returned).toBe(deferred);
      await deferred;
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.SUCCESS,
        message: 'stashed to ~/bookmarks',
      });
    });

    it('shows a loading toast after the grace period, then swaps it in place on resolve', async () => {
      const { store, resolvePromise, loadingId } = await createLoadingToast();
      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.INFO,
        isLoading: true,
        durationMs: undefined,
      });

      resolvePromise('done');
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        id: loadingId,
        type: TOAST_TYPE.SUCCESS,
        isLoading: false,
        title: 'Saved',
      });
      expect(store.getState().visible[0]!.durationMs).toEqual(
        expect.any(Number),
      );
    });

    it('swaps the loading toast to error on reject', async () => {
      const store = createToastStore();
      let rejectPromise!: (reason: unknown) => void;
      const pending = new Promise<string>((_resolve, reject) => {
        rejectPromise = reject;
      });

      const returned = store.actions.promise(pending, {
        loading: { title: 'Saving', message: 'saving…' },
        success: { title: 'Saved', message: 'saved' },
        error: { title: 'Failed', message: '! failed' },
      });
      returned.catch(() => {});

      await vi.advanceTimersToNextTimerAsync();
      rejectPromise(new Error('network error'));
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.ERROR,
        isLoading: false,
        title: 'Failed',
        durationMs: undefined,
      });
    });

    it('does not resurrect a loading toast the reader already dismissed before it settled', async () => {
      const { store, resolvePromise, loadingId } = await createLoadingToast();

      store.actions.dismiss(loadingId);
      await vi.advanceTimersToNextTimerAsync();
      expect(store.getState().visible).toHaveLength(0);

      resolvePromise('done');
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible).toHaveLength(0);
    });
  });

  describe('destroy', () => {
    it('clears pending timers so they never fire after teardown', () => {
      const store = createToastStore();
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      const listener = vi.fn();
      store.subscribe(listener);

      store.destroy();
      listener.mockClear();
      vi.runAllTimers();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
