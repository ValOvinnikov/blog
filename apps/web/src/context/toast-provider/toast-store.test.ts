import { TOAST_TYPE, type TToastType } from '@blog/config';
import { faker } from '@faker-js/faker';

import { createToastStore, type IToastPayload } from './toast-store';

faker.seed(6012);

type TToastStore = ReturnType<typeof createToastStore>;

const MOCK_START_TIME = faker.date.past({ refDate: '2026-01-01T00:00:00Z' });
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_COALESCE_KEY = faker.string.uuid();
const MOCK_CUSTOM_DURATION_MS = faker.number.int({ min: 500, max: 900 });
const MOCK_ELAPSED_MS = faker.number.int({ min: 500, max: 1500 });
const MOCK_MERGE_STEP_MS = faker.number.int({ min: 50, max: 300 });
const MOCK_LONG_DELAY_MS = faker.number.int({ min: 60_000, max: 3_600_000 });
const MOCK_RESOLVED_VALUE = faker.system.directoryPath();
const MOCK_PROMISE_MESSAGES = {
  loading: { title: faker.lorem.words(2), message: faker.lorem.sentence() },
  success: { title: faker.lorem.words(2), message: faker.lorem.sentence() },
  error: { title: faker.lorem.words(2), message: faker.lorem.sentence() },
};

const buildPayload = (overrides?: Partial<IToastPayload>): IToastPayload => ({
  title: MOCK_TITLE,
  message: MOCK_MESSAGE,
  ...overrides,
});

const buildDistinctPayload = (): IToastPayload =>
  buildPayload({ message: faker.lorem.sentence() });

const findVisible = (store: TToastStore, id: string) =>
  store.getState().visible.find((toast) => toast.id === id);

const visibleIds = (store: TToastStore) =>
  store.getState().visible.map((toast) => toast.id);

const pendingIds = (store: TToastStore) =>
  store.getState().pending.map((toast) => toast.id);

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
    probe.actions.show(TOAST_TYPE.INFO, buildDistinctPayload());
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
  store: TToastStore,
  type: TToastType,
  cap: number,
): string[] =>
  Array.from({ length: cap }, () =>
    store.actions.show(type, buildDistinctPayload()),
  );

const showLoadingToast = async (store: TToastStore) => {
  let resolvePromise!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  store.actions.promise(pending, MOCK_PROMISE_MESSAGES);

  await vi.advanceTimersToNextTimerAsync();
  const loadingId = store.getState().visible[0]!.id;

  return { resolvePromise, loadingId };
};

describe(createToastStore, () => {
  let store: TToastStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_START_TIME);
    store = createToastStore();
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  describe('show', () => {
    it('enqueues a new toast in the entering phase', () => {
      const successLifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);

      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      const toast = findVisible(store, id);
      expect(visibleIds(store)).toEqual([id]);
      expect(toast?.type).toBe(TOAST_TYPE.SUCCESS);
      expect(toast?.title).toBe(MOCK_TITLE);
      expect(toast?.message).toBe(MOCK_MESSAGE);
      expect(toast?.phase).toBe('entering');
      expect(toast?.paused).toBe(false);
      expect(toast?.durationMs).toBe(successLifeMs);
    });

    it('gives warning a longer life than success', () => {
      const warningLifeMs = measureDefaultLifeMs(TOAST_TYPE.WARNING);
      const successLifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);

      expect(warningLifeMs).toBeGreaterThan(successLifeMs);
    });

    it('honors an explicit duration override', () => {
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ durationMs: MOCK_CUSTOM_DURATION_MS }),
      );

      expect(findVisible(store, id)?.durationMs).toBe(MOCK_CUSTOM_DURATION_MS);
    });

    it('auto-dismisses after its life elapses, leaving then removed', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      vi.advanceTimersToNextTimer();
      expect(findVisible(store, id)?.phase).toBe('leaving');

      vi.advanceTimersToNextTimer();
      expect(findVisible(store, id)).toBeUndefined();
    });

    it('never auto-dismisses an error toast', () => {
      const id = store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      vi.runAllTimers();

      expect(findVisible(store, id)?.phase).toBe('entering');
    });
  });

  describe('cap and eviction', () => {
    it('evicts the oldest non-error toast when one more than the cap is shown', () => {
      const cap = discoverQueueCap();
      const ids = fillVisibleToCap(store, TOAST_TYPE.INFO, cap);

      const overflowId = store.actions.show(
        TOAST_TYPE.INFO,
        buildDistinctPayload(),
      );

      expect(visibleIds(store)).toEqual([...ids.slice(1), overflowId]);
    });

    it('queues a new toast instead of evicting when every slot holds an error', () => {
      const cap = discoverQueueCap();
      const errorIds = fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);

      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      expect(visibleIds(store)).toEqual(errorIds);
      expect(pendingIds(store)).toEqual([queuedId]);
    });

    it('promotes the oldest pending toast once a visible slot frees up', () => {
      const cap = discoverQueueCap();
      const errorIds = fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(errorIds[0]);
      vi.advanceTimersToNextTimer();

      expect(visibleIds(store)).toEqual([...errorIds.slice(1), queuedId]);
      expect(pendingIds(store)).toEqual([]);
    });
  });

  describe('coalescing', () => {
    it('replaces the toast in place when a coalesce key repeats', () => {
      const secondMessage = faker.lorem.sentence();

      const firstId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: MOCK_COALESCE_KEY }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({
          message: secondMessage,
          coalesceKey: MOCK_COALESCE_KEY,
        }),
      );

      const toast = findVisible(store, firstId);
      expect(secondId).toBe(firstId);
      expect(visibleIds(store)).toEqual([firstId]);
      expect(toast?.type).toBe(TOAST_TYPE.INFO);
      expect(toast?.message).toBe(secondMessage);
    });

    it('restarts the full duration when a coalesce key repeats', () => {
      const lifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: MOCK_COALESCE_KEY }),
      );
      store.actions.markEntered(id);
      vi.advanceTimersByTime(lifeMs - MOCK_ELAPSED_MS);
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: MOCK_COALESCE_KEY }),
      );

      vi.advanceTimersByTime(MOCK_ELAPSED_MS);
      expect(findVisible(store, id)?.phase).toBe('visible');

      vi.advanceTimersByTime(lifeMs - MOCK_ELAPSED_MS);
      expect(findVisible(store, id)?.phase).toBe('leaving');
    });

    it('collapses identical success toasts within the merge window into a count', () => {
      const firstId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(MOCK_MERGE_STEP_MS);
      const secondId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(MOCK_MERGE_STEP_MS);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(secondId).toBe(firstId);
      expect(visibleIds(store)).toEqual([firstId]);
      expect(findVisible(store, firstId)?.count).toBe(3);
    });

    it('un-pauses and re-arms the timer when a merge hits a paused toast', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      store.actions.pause(id);
      expect(findVisible(store, id)?.paused).toBe(true);

      const mergedId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      const merged = findVisible(store, id);
      expect(mergedId).toBe(id);
      expect(merged?.paused).toBe(false);
      expect(merged?.count).toBe(2);

      vi.advanceTimersToNextTimer();
      expect(findVisible(store, id)?.phase).toBe('leaving');
    });

    it('does not merge once a long delay has elapsed', () => {
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.setSystemTime(Date.now() + MOCK_LONG_DELAY_MS);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(visibleIds(store)).toHaveLength(2);
    });

    it('never merges identical error toasts', () => {
      const firstId = store.actions.show(TOAST_TYPE.ERROR, buildPayload());
      const secondId = store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      expect(visibleIds(store)).toEqual([firstId, secondId]);
      expect(findVisible(store, firstId)?.count).toBeUndefined();
      expect(findVisible(store, secondId)?.count).toBeUndefined();
    });
  });

  describe('pause and resume', () => {
    it('resumes auto-dismiss from the exact remaining time', () => {
      const lifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      vi.advanceTimersByTime(MOCK_ELAPSED_MS);
      store.actions.pause(id);

      vi.advanceTimersByTime(lifeMs);
      expect(findVisible(store, id)?.phase).toBe('entering');
      expect(findVisible(store, id)?.paused).toBe(true);

      store.actions.resume(id);

      vi.advanceTimersByTime(lifeMs - MOCK_ELAPSED_MS - 1);
      expect(findVisible(store, id)?.phase).toBe('entering');
      vi.advanceTimersByTime(1);
      expect(findVisible(store, id)?.phase).toBe('leaving');
    });

    it('ignores a resume on a running toast', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.resume(id);

      expect(findVisible(store, id)?.paused).toBe(false);
    });

    it('keeps a toast paused when it is paused twice', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.pause(id);
      store.actions.pause(id);

      expect(findVisible(store, id)?.paused).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('dismisses the given id', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.dismiss(id);
      vi.advanceTimersToNextTimer();

      expect(visibleIds(store)).toEqual([]);
    });

    it('dismisses the newest toast when no id is given', () => {
      const firstId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildDistinctPayload(),
      );
      store.actions.show(TOAST_TYPE.SUCCESS, buildDistinctPayload());

      store.actions.dismiss();
      vi.advanceTimersToNextTimer();

      expect(visibleIds(store)).toEqual([firstId]);
    });

    it('removes a pending toast without a leave animation', () => {
      const cap = discoverQueueCap();
      fillVisibleToCap(store, TOAST_TYPE.ERROR, cap);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(queuedId);

      expect(pendingIds(store)).toEqual([]);
    });

    it('does nothing when the queue is empty', () => {
      expect(() => store.actions.dismiss()).not.toThrow();
    });
  });

  describe('markEntered', () => {
    it('flips an entering toast to visible', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.markEntered(id);

      expect(findVisible(store, id)?.phase).toBe('visible');
    });
  });

  describe('promise', () => {
    it('skips loading when the promise settles before the grace period', async () => {
      const settled = Promise.resolve(MOCK_RESOLVED_VALUE);

      const returned = store.actions.promise(settled, {
        ...MOCK_PROMISE_MESSAGES,
        success: (value) => ({
          title: MOCK_PROMISE_MESSAGES.success.title,
          message: `${MOCK_PROMISE_MESSAGES.success.message} ${value}`,
        }),
      });
      await settled;
      await vi.advanceTimersByTimeAsync(0);

      const [toast] = store.getState().visible;
      expect(returned).toBe(settled);
      expect(store.getState().visible).toHaveLength(1);
      expect(toast?.type).toBe(TOAST_TYPE.SUCCESS);
      expect(toast?.message).toBe(
        `${MOCK_PROMISE_MESSAGES.success.message} ${MOCK_RESOLVED_VALUE}`,
      );
    });

    it('swaps the loading toast to a sticky error on reject', async () => {
      let rejectPromise!: (reason: unknown) => void;
      const pending = new Promise<string>((_resolve, reject) => {
        rejectPromise = reject;
      });
      store.actions.promise(pending, MOCK_PROMISE_MESSAGES).catch(() => {});

      await vi.advanceTimersToNextTimerAsync();
      rejectPromise(new Error(faker.lorem.sentence()));
      await vi.advanceTimersByTimeAsync(0);

      const [toast] = store.getState().visible;
      expect(toast?.type).toBe(TOAST_TYPE.ERROR);
      expect(toast?.isLoading).toBe(false);
      expect(toast?.title).toBe(MOCK_PROMISE_MESSAGES.error.title);
      expect(toast?.durationMs).toBeUndefined();
    });

    describe('with a loading toast on screen', () => {
      let resolvePromise: (value: string) => void;
      let loadingId: string;

      beforeEach(async () => {
        ({ resolvePromise, loadingId } = await showLoadingToast(store));
      });

      it('shows a sticky loading toast after the grace period', () => {
        const [toast] = store.getState().visible;

        expect(visibleIds(store)).toEqual([loadingId]);
        expect(toast?.type).toBe(TOAST_TYPE.INFO);
        expect(toast?.isLoading).toBe(true);
        expect(toast?.durationMs).toBeUndefined();
      });

      it('swaps the loading toast in place when the promise resolves', async () => {
        const successLifeMs = measureDefaultLifeMs(TOAST_TYPE.SUCCESS);

        resolvePromise(MOCK_RESOLVED_VALUE);
        await vi.advanceTimersByTimeAsync(0);

        const toast = findVisible(store, loadingId);
        expect(visibleIds(store)).toEqual([loadingId]);
        expect(toast?.type).toBe(TOAST_TYPE.SUCCESS);
        expect(toast?.isLoading).toBe(false);
        expect(toast?.title).toBe(MOCK_PROMISE_MESSAGES.success.title);
        expect(toast?.durationMs).toBe(successLifeMs);
      });

      it('does not resurrect a loading toast dismissed before it settled', async () => {
        store.actions.dismiss(loadingId);
        await vi.advanceTimersToNextTimerAsync();
        expect(visibleIds(store)).toEqual([]);

        resolvePromise(MOCK_RESOLVED_VALUE);
        await vi.advanceTimersByTimeAsync(0);

        expect(visibleIds(store)).toEqual([]);
      });
    });
  });

  describe('destroy', () => {
    it('clears pending timers so they never fire after teardown', () => {
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
