import { TOAST_TYPE } from '@blog/config';

import {
  createToastStore,
  TOAST_DEFAULT_LIFE_MS,
  TOAST_EXIT_ANIMATION_MS,
  TOAST_MERGE_WINDOW_MS,
  TOAST_PROMISE_GRACE_MS,
  TOAST_QUEUE_CAP,
  type IToastPayload,
} from './toast-store';

const buildPayload = (overrides?: Partial<IToastPayload>): IToastPayload => ({
  command: 'Bookmark',
  state: 'Saved',
  message: 'Saved to bookmarks',
  ...overrides,
});

describe(createToastStore, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show', () => {
    it('enqueues a new toast in the entering phase with the type default life', () => {
      const store = createToastStore();

      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        id,
        type: TOAST_TYPE.SUCCESS,
        command: 'Bookmark',
        state: 'Saved',
        phase: 'entering',
        paused: false,
        durationMs: TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS],
      });
    });

    it('defaults warning to a 5s life and leaves error sticky (no durationMs)', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.WARNING, buildPayload());
      store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      const [warning, error] = store.getState().visible;
      expect(warning!.durationMs).toBe(
        TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.WARNING],
      );
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

      vi.advanceTimersByTime(TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS]!);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );

      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);
      expect(store.getState().visible.find((t) => t.id === id)).toBeUndefined();
    });

    it('never auto-dismisses an error toast', () => {
      const store = createToastStore();
      const id = store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      vi.advanceTimersByTime(60_000);

      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
    });
  });

  describe('cap and eviction', () => {
    it('evicts the oldest non-error toast instantly once the cap is exceeded', () => {
      const store = createToastStore();
      // Distinct messages so the counter-merge rule never collapses these —
      // eviction is about volume, not identical repeats.
      const ids = Array.from({ length: TOAST_QUEUE_CAP }, (_, i) =>
        store.actions.show(
          TOAST_TYPE.INFO,
          buildPayload({ message: `msg-${i}` }),
        ),
      );

      const fifthId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({ message: 'msg-fifth' }),
      );

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).toHaveLength(TOAST_QUEUE_CAP);
      expect(visibleIds).not.toContain(ids[0]);
      expect(visibleIds).toContain(fifthId);
    });

    it('queues a new toast instead of evicting when every visible slot is an error', () => {
      const store = createToastStore();
      Array.from({ length: TOAST_QUEUE_CAP }, () =>
        store.actions.show(TOAST_TYPE.ERROR, buildPayload()),
      );

      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      expect(store.getState().visible).toHaveLength(TOAST_QUEUE_CAP);
      expect(store.getState().visible.some((t) => t.id === queuedId)).toBe(
        false,
      );
      expect(store.getState().pending.map((t) => t.id)).toContain(queuedId);
    });

    it('promotes the oldest pending toast once a visible slot frees up', () => {
      const store = createToastStore();
      const errorIds = Array.from({ length: TOAST_QUEUE_CAP }, () =>
        store.actions.show(TOAST_TYPE.ERROR, buildPayload()),
      );
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(errorIds[0]);
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);

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
        buildPayload({ state: 'Saved', coalesceKey: key }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({ state: 'Removed', coalesceKey: key }),
      );

      expect(secondId).toBe(firstId);
      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.INFO,
        state: 'Removed',
      });
    });

    it('toggle-collapse resets the timer to the fresh full duration', () => {
      const store = createToastStore();
      const key = 'bookmark:post-1';

      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );
      store.actions.markEntered(id);
      vi.advanceTimersByTime(3000);
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: key }),
      );

      // Only 600ms of the *original* 3.6s life remained — if the timer had
      // not been reset, the toast would already be leaving by now.
      vi.advanceTimersByTime(600);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'visible',
      );

      vi.advanceTimersByTime(TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS]! - 600);
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

      // A duplicate within the merge window arrives while the toast is
      // still paused (e.g. it's being hovered).
      const mergedId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      expect(mergedId).toBe(id);

      const merged = store.getState().visible.find((t) => t.id === id);
      expect(merged?.paused).toBe(false);
      expect(merged?.count).toBe(2);

      // The re-armed timer must genuinely be running, not stuck behind a
      // stale `paused: true` that nothing will ever clear (`pause()`
      // no-ops once already paused, so continued hovering could never
      // have cleared it either).
      vi.advanceTimersByTime(TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS]!);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'leaving',
      );
    });

    it('does not merge once the 1s window has elapsed', () => {
      const store = createToastStore();

      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(TOAST_MERGE_WINDOW_MS + 1);
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
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      const lifeMs = TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS]!;

      vi.advanceTimersByTime(1000);
      store.actions.pause(id);

      // Time passes with the toast paused — it must not leave.
      vi.advanceTimersByTime(lifeMs);
      expect(store.getState().visible.find((t) => t.id === id)?.phase).toBe(
        'entering',
      );
      expect(store.getState().visible.find((t) => t.id === id)?.paused).toBe(
        true,
      );

      store.actions.resume(id);

      // Exactly the remaining ~2600ms, not the full life, should fire it.
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
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);

      expect(store.getState().visible).toHaveLength(0);
    });

    it('dismisses the newest toast when no id is given', () => {
      const store = createToastStore();
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload({ state: 'first' }));
      const secondId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ state: 'second', coalesceKey: 'irrelevant' }),
      );

      store.actions.dismiss();
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);

      const visibleIds = store.getState().visible.map((t) => t.id);
      expect(visibleIds).not.toContain(secondId);
      expect(store.getState().visible).toHaveLength(1);
    });

    it('removes a pending (not-yet-visible) toast without a leave animation', () => {
      const store = createToastStore();
      Array.from({ length: TOAST_QUEUE_CAP }, () =>
        store.actions.show(TOAST_TYPE.ERROR, buildPayload()),
      );
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
        command: 'Bookmark',
        loading: { state: 'Saving', message: 'saving…' },
        success: (value) => ({
          state: 'Saved',
          message: `stashed to ${value}`,
        }),
        error: { state: 'Failed', message: '! failed' },
      });

      expect(returned).toBe(deferred);
      await deferred;
      // Flush the microtask queue's `.then` callback under fake timers.
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible).toHaveLength(1);
      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.SUCCESS,
        message: 'stashed to ~/bookmarks',
      });
    });

    it('shows a loading toast after the grace period, then swaps it in place on resolve', async () => {
      const store = createToastStore();
      let resolvePromise!: (value: string) => void;
      const pending = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      store.actions.promise(pending, {
        command: 'Bookmark',
        loading: { state: 'Saving', message: 'saving…' },
        success: { state: 'Saved', message: 'saved' },
        error: { state: 'Failed', message: 'failed' },
      });

      await vi.advanceTimersByTimeAsync(TOAST_PROMISE_GRACE_MS);
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
        state: 'Saved',
        durationMs: TOAST_DEFAULT_LIFE_MS[TOAST_TYPE.SUCCESS],
      });
    });

    it('swaps the loading toast to error on reject', async () => {
      const store = createToastStore();
      let rejectPromise!: (reason: unknown) => void;
      const pending = new Promise<string>((_resolve, reject) => {
        rejectPromise = reject;
      });

      const returned = store.actions.promise(pending, {
        command: 'Bookmark',
        loading: { state: 'Saving', message: 'saving…' },
        success: { state: 'Saved', message: 'saved' },
        error: { state: 'Failed', message: '! failed' },
      });
      // The store's own internal `.then` must not surface as an unhandled
      // rejection warning independently from this assertion's own handling.
      returned.catch(() => {});

      await vi.advanceTimersByTimeAsync(TOAST_PROMISE_GRACE_MS);
      rejectPromise(new Error('network error'));
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible[0]).toMatchObject({
        type: TOAST_TYPE.ERROR,
        isLoading: false,
        state: 'Failed',
        durationMs: undefined,
      });
    });

    it('does not resurrect a loading toast the reader already dismissed before it settled', async () => {
      const store = createToastStore();
      let resolvePromise!: (value: string) => void;
      const pending = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      store.actions.promise(pending, {
        command: 'Bookmark',
        loading: { state: 'Saving', message: 'saving…' },
        success: { state: 'Saved', message: 'saved' },
        error: { state: 'Failed', message: 'failed' },
      });

      await vi.advanceTimersByTimeAsync(TOAST_PROMISE_GRACE_MS);
      const loadingId = store.getState().visible[0]!.id;
      store.actions.dismiss(loadingId);
      await vi.advanceTimersByTimeAsync(TOAST_EXIT_ANIMATION_MS);
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
