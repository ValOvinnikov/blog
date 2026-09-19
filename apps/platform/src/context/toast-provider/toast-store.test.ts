import { TOAST_TYPE, type TToastType } from '@blog/config';

import { createToastStore, type IToastPayload } from './toast-store';

const buildPayload = (overrides?: Partial<IToastPayload>): IToastPayload => ({
  title: 'Bookmark saved',
  message: 'Saved to bookmarks',
  ...overrides,
});

const showPendingPromiseToast = (
  store: ReturnType<typeof createToastStore>,
) => {
  let resolvePromise!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  store.actions.promise(pending, {
    loading: { title: 'Saving', message: 'saving…' },
    success: { title: 'Saved', message: 'saved' },
    error: { title: 'Failed', message: 'failed' },
  });

  return { resolvePromise };
};

const fillVisibleQueue = (
  store: ReturnType<typeof createToastStore>,
  type: TToastType,
) => {
  const addedIds: string[] = [];
  let lastId = '';
  let cappedAt = -1;

  for (let i = 0; i < 100 && cappedAt === -1; i++) {
    const beforeLength = store.getState().visible.length;
    lastId = store.actions.show(
      type,
      buildPayload({ message: `fill-${addedIds.length}` }),
    );

    if (store.getState().visible.length > beforeLength) {
      addedIds.push(lastId);
    } else {
      cappedAt = addedIds.length;
    }
  }

  if (cappedAt === -1) {
    throw new Error('fillVisibleQueue never found the cap within 100 pushes');
  }

  return { addedIds, lastId };
};

const fillWithErrorsToCap = (store: ReturnType<typeof createToastStore>) => {
  const ids: string[] = [];
  let overflowId = '';

  for (let i = 0; i < 100 && !overflowId; i++) {
    const beforeLength = store.getState().visible.length;
    const id = store.actions.show(
      TOAST_TYPE.ERROR,
      buildPayload({ message: `err-${ids.length}` }),
    );

    if (store.getState().visible.length === beforeLength) {
      overflowId = id;
    } else {
      ids.push(id);
    }
  }

  store.actions.dismiss(overflowId);
  return ids;
};

describe(createToastStore, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show', () => {
    it('enqueues a new toast in the entering phase, armed to auto-dismiss', () => {
      const store = createToastStore();

      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(store.getState().visible).toHaveLength(1);
      const record = store.getState().visible[0];
      expect(record).toMatchObject({
        id,
        type: TOAST_TYPE.SUCCESS,
        title: 'Bookmark saved',
        phase: 'entering',
        paused: false,
      });
      expect(record?.durationMs).toBeGreaterThan(0);
    });

    it('assigns a default life to warning but leaves error sticky', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.WARNING, buildPayload());
      store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      const [warning, error] = store.getState().visible;
      expect(warning!.durationMs).toBeGreaterThan(0);
      expect(error!.durationMs).toBeUndefined();
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
    it('evicts the oldest non-error toast once the visible queue is full', () => {
      const store = createToastStore();

      const { addedIds, lastId } = fillVisibleQueue(store, TOAST_TYPE.INFO);

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).toHaveLength(addedIds.length);
      expect(visibleIds).not.toContain(addedIds[0]);
      expect(visibleIds).toContain(lastId);
    });

    it('queues a new toast instead of evicting when every visible slot is an error', () => {
      const store = createToastStore();
      const errorIds = fillWithErrorsToCap(store);

      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      expect(store.getState().visible).toHaveLength(errorIds.length);
      expect(store.getState().visible.some((t) => t.id === queuedId)).toBe(
        false,
      );
      expect(store.getState().pending.map((t) => t.id)).toContain(queuedId);
    });

    it('promotes the oldest pending toast once a visible slot frees up', () => {
      const store = createToastStore();
      const errorIds = fillWithErrorsToCap(store);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(errorIds[0]!);
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
        buildPayload({ title: 'Saved', coalesceKey: key }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({ title: 'Removed', coalesceKey: key }),
      );

      expect(secondId).toBe(firstId);
      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.INFO,
        title: 'Removed',
      });
    });

    it('toggle-collapse resets the timer to a fresh full duration', () => {
      const store = createToastStore();
      const key = 'bookmark:post-1';

      const controlId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'control' }),
      );
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );

      vi.advanceTimersByTime(1);
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );

      vi.advanceTimersToNextTimer();
      expect(
        store.getState().visible.find((t) => t.id === controlId)?.phase,
      ).toBe('leaving');
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );

      vi.advanceTimersToNextTimer();
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

    it('counter-merge while paused un-pauses and re-arms a fresh timer', () => {
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

    it('does not merge once enough time has passed', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.setSystemTime(new Date(Date.now() + 10 * 60 * 1000));
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
      const store = createToastStore();
      const controlId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'control' }),
      );
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: 'paused' }),
      );

      const start = Date.now();
      const elapsedBeforePause = 1000;
      vi.advanceTimersByTime(elapsedBeforePause);
      store.actions.pause(id);

      vi.advanceTimersToNextTimer();
      const fullLifeMs = Date.now() - start;
      expect(
        store.getState().visible.find((t) => t.id === controlId)?.phase,
      ).toBe('leaving');
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
      expect(store.getState().visible.find((t) => t.id === id)?.paused).toBe(
        true,
      );

      store.actions.resume(id);
      const remainingMs = fullLifeMs - elapsedBeforePause;

      vi.advanceTimersByTime(remainingMs - 1);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
      vi.advanceTimersByTime(1);
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
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload({ title: 'first' }));
      const secondId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ title: 'second', coalesceKey: 'irrelevant' }),
      );

      store.actions.dismiss();
      vi.advanceTimersToNextTimer();

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).not.toContain(secondId);
      expect(store.getState().visible).toHaveLength(1);
    });

    it('removes a pending (not-yet-visible) toast without a leave animation', () => {
      const store = createToastStore();
      fillWithErrorsToCap(store);
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

    it('shows a loading toast only after the grace period elapses, then swaps it in place on resolve', async () => {
      const store = createToastStore();
      const { resolvePromise } = showPendingPromiseToast(store);

      expect(store.getState().visible).toHaveLength(0);

      await vi.advanceTimersToNextTimerAsync();
      expect(store.getState().visible).toHaveLength(1);
      const loadingId = store.getState().visible[0]!.id;
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
      expect(store.getState().visible[0]!.durationMs).toBeGreaterThan(0);
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
      const store = createToastStore();
      const { resolvePromise } = showPendingPromiseToast(store);

      await vi.advanceTimersToNextTimerAsync();
      const loadingId = store.getState().visible[0]!.id;
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
      vi.advanceTimersByTime(60_000);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
