import { TOAST_TYPE, type TToastType } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { IToastPayload } from '@platform/components/shared/toast';

import { createToastStore } from './toast-store';

faker.seed(11);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_COALESCE_KEY = faker.string.uuid();
const MOCK_FIRST_TITLE = faker.string.uuid();
const MOCK_SECOND_TITLE = faker.string.uuid();
const MOCK_CONTROL_MESSAGE = faker.string.uuid();
const MOCK_PAUSED_MESSAGE = faker.string.uuid();
const MOCK_LOADING_PAYLOAD = {
  title: faker.string.uuid(),
  message: faker.lorem.sentence(),
};
const MOCK_SUCCESS_PAYLOAD = {
  title: faker.string.uuid(),
  message: faker.lorem.sentence(),
};
const MOCK_ERROR_PAYLOAD = {
  title: faker.string.uuid(),
  message: faker.lorem.sentence(),
};
const MOCK_PROMISE_VALUE = faker.system.filePath();
const MOCK_DURATION_MS = 1000;
const MOCK_ELAPSED_BEFORE_PAUSE_MS = 1000;
const MOCK_MERGE_WINDOW_EXCEEDED_MS = 10 * 60 * 1000;
const MOCK_MERGE_STEP_MS = 100;
const MOCK_TEARDOWN_ADVANCE_MS = 60_000;

type TToastStore = ReturnType<typeof createToastStore>;

const buildPayload = (overrides?: Partial<IToastPayload>): IToastPayload => ({
  title: MOCK_TITLE,
  message: MOCK_MESSAGE,
  ...overrides,
});

const showPendingPromiseToast = (store: TToastStore) => {
  let resolvePromise!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  store.actions.promise(pending, {
    loading: MOCK_LOADING_PAYLOAD,
    success: MOCK_SUCCESS_PAYLOAD,
    error: MOCK_ERROR_PAYLOAD,
  });

  return { resolvePromise };
};

const fillVisibleQueue = (store: TToastStore, type: TToastType) => {
  const addedIds: string[] = [];
  let lastId = '';
  let hasReachedCap = false;

  for (let i = 0; i < 100 && !hasReachedCap; i++) {
    const beforeLength = store.getState().visible.length;
    lastId = store.actions.show(
      type,
      buildPayload({ message: `${MOCK_MESSAGE} ${addedIds.length}` }),
    );

    if (store.getState().visible.length > beforeLength) {
      addedIds.push(lastId);
    } else {
      hasReachedCap = true;
    }
  }

  if (!hasReachedCap) {
    throw new Error('fillVisibleQueue never found the cap within 100 pushes');
  }

  return { addedIds, lastId };
};

const fillWithErrorsToCap = (store: TToastStore) => {
  const ids: string[] = [];
  let overflowId = '';

  for (let i = 0; i < 100 && !overflowId; i++) {
    const beforeLength = store.getState().visible.length;
    const id = store.actions.show(
      TOAST_TYPE.ERROR,
      buildPayload({ message: `${MOCK_MESSAGE} ${ids.length}` }),
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
  let store: TToastStore;

  const findVisible = (id: string) =>
    store.getState().visible.find((toast) => toast.id === id);

  beforeEach(() => {
    vi.useFakeTimers();
    store = createToastStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show', () => {
    it('enqueues a new toast in the entering phase, armed to auto-dismiss', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      const { visible } = store.getState();
      const [record] = visible;
      expect(visible).toHaveLength(1);
      expect(record?.id).toBe(id);
      expect(record?.type).toBe(TOAST_TYPE.SUCCESS);
      expect(record?.title).toBe(MOCK_TITLE);
      expect(record?.message).toBe(MOCK_MESSAGE);
      expect(record?.phase).toBe('entering');
      expect(record?.paused).toBe(false);
      expect(record?.durationMs).toBeGreaterThan(0);
    });

    it('gives a warning toast a default life', () => {
      const id = store.actions.show(TOAST_TYPE.WARNING, buildPayload());

      expect(findVisible(id)?.durationMs).toBeGreaterThan(0);
    });

    it('honors an explicit durationMs override', () => {
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ durationMs: MOCK_DURATION_MS }),
      );

      expect(findVisible(id)?.durationMs).toBe(MOCK_DURATION_MS);
    });

    it('auto-dismisses after its life elapses, leaving then removed', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      vi.advanceTimersToNextTimer();
      expect(findVisible(id)?.phase).toBe('leaving');

      vi.advanceTimersToNextTimer();
      expect(findVisible(id)).toBeUndefined();
    });

    it('never auto-dismisses an error toast', () => {
      const id = store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      vi.runAllTimers();

      expect(findVisible(id)?.phase).toBe('entering');
      expect(findVisible(id)?.durationMs).toBeUndefined();
    });
  });

  describe('cap and eviction', () => {
    it('evicts the oldest non-error toast once the visible queue is full', () => {
      const { addedIds, lastId } = fillVisibleQueue(store, TOAST_TYPE.INFO);

      const visibleIds = store.getState().visible.map((toast) => toast.id);
      expect(visibleIds).toHaveLength(addedIds.length);
      expect(visibleIds).not.toContain(addedIds[0]);
      expect(visibleIds).toContain(lastId);
    });

    it('queues a new toast instead of evicting when every slot is an error', () => {
      const errorIds = fillWithErrorsToCap(store);

      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      const { visible, pending } = store.getState();
      expect(visible).toHaveLength(errorIds.length);
      expect(findVisible(queuedId)).toBeUndefined();
      expect(pending.map((toast) => toast.id)).toContain(queuedId);
    });

    it('promotes the oldest pending toast once a visible slot frees up', () => {
      const errorIds = fillWithErrorsToCap(store);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(errorIds[0]);
      vi.advanceTimersToNextTimer();

      const { visible, pending } = store.getState();
      expect(visible.map((toast) => toast.id)).toContain(queuedId);
      expect(pending).toHaveLength(0);
    });
  });

  describe('coalescing', () => {
    it('replaces the toast in place when a coalesceKey repeats', () => {
      const firstId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({
          title: MOCK_FIRST_TITLE,
          coalesceKey: MOCK_COALESCE_KEY,
        }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.INFO,
        buildPayload({
          title: MOCK_SECOND_TITLE,
          coalesceKey: MOCK_COALESCE_KEY,
        }),
      );

      const { visible } = store.getState();
      expect(secondId).toBe(firstId);
      expect(visible).toHaveLength(1);
      expect(visible[0]?.type).toBe(TOAST_TYPE.INFO);
      expect(visible[0]?.title).toBe(MOCK_SECOND_TITLE);
    });

    it('resets the timer to a fresh full duration on a coalesced repeat', () => {
      const controlId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: MOCK_CONTROL_MESSAGE }),
      );
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: MOCK_COALESCE_KEY }),
      );

      vi.advanceTimersByTime(1);
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ coalesceKey: MOCK_COALESCE_KEY }),
      );

      vi.advanceTimersToNextTimer();
      expect(findVisible(controlId)?.phase).toBe('leaving');
      expect(findVisible(id)?.phase).toBe('entering');

      vi.advanceTimersToNextTimer();
      expect(findVisible(id)?.phase).toBe('leaving');
    });

    it('merges identical success toasts in the window into an incrementing count', () => {
      const firstId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(MOCK_MERGE_STEP_MS);
      const secondId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.advanceTimersByTime(MOCK_MERGE_STEP_MS);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      const { visible } = store.getState();
      expect(secondId).toBe(firstId);
      expect(visible).toHaveLength(1);
      expect(visible[0]?.count).toBe(3);
    });

    it('un-pauses and re-arms a fresh timer when a merge hits a paused toast', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      store.actions.pause(id);
      expect(findVisible(id)?.paused).toBe(true);

      const mergedId = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(mergedId).toBe(id);
      expect(findVisible(id)?.paused).toBe(false);
      expect(findVisible(id)?.count).toBe(2);

      vi.advanceTimersToNextTimer();
      expect(findVisible(id)?.phase).toBe('leaving');
    });

    it('does not merge once enough time has passed', () => {
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      vi.setSystemTime(Date.now() + MOCK_MERGE_WINDOW_EXCEEDED_MS);
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      expect(store.getState().visible).toHaveLength(2);
    });

    it('never merges identical error toasts within the window', () => {
      store.actions.show(TOAST_TYPE.ERROR, buildPayload());
      store.actions.show(TOAST_TYPE.ERROR, buildPayload());

      const { visible } = store.getState();
      expect(visible).toHaveLength(2);
      expect(visible.map((toast) => toast.count)).toEqual([
        undefined,
        undefined,
      ]);
    });
  });

  describe('pause / resume', () => {
    it('pauses the auto-dismiss timer and resumes from the remaining time', () => {
      const controlId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: MOCK_CONTROL_MESSAGE }),
      );
      const id = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ message: MOCK_PAUSED_MESSAGE }),
      );

      const start = Date.now();
      vi.advanceTimersByTime(MOCK_ELAPSED_BEFORE_PAUSE_MS);
      store.actions.pause(id);

      vi.advanceTimersToNextTimer();
      const fullLifeMs = Date.now() - start;
      expect(findVisible(controlId)?.phase).toBe('leaving');
      expect(findVisible(id)?.phase).toBe('entering');
      expect(findVisible(id)?.paused).toBe(true);

      store.actions.resume(id);
      const remainingMs = fullLifeMs - MOCK_ELAPSED_BEFORE_PAUSE_MS;

      vi.advanceTimersByTime(remainingMs - 1);
      expect(findVisible(id)?.phase).toBe('entering');
      vi.advanceTimersByTime(1);
      expect(findVisible(id)?.phase).toBe('leaving');
    });

    it('ignores a resume on a running toast', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.resume(id);

      expect(findVisible(id)?.paused).toBe(false);
    });

    it('stays paused when paused twice', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.pause(id);
      store.actions.pause(id);

      expect(findVisible(id)?.paused).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('dismisses the given id', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.dismiss(id);
      vi.advanceTimersToNextTimer();

      expect(store.getState().visible).toHaveLength(0);
    });

    it('dismisses the newest toast when no id is given', () => {
      store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ title: MOCK_FIRST_TITLE }),
      );
      const secondId = store.actions.show(
        TOAST_TYPE.SUCCESS,
        buildPayload({ title: MOCK_SECOND_TITLE }),
      );

      store.actions.dismiss();
      vi.advanceTimersToNextTimer();

      const { visible } = store.getState();
      expect(visible.map((toast) => toast.id)).not.toContain(secondId);
      expect(visible).toHaveLength(1);
    });

    it('removes a pending toast without a leave animation', () => {
      fillWithErrorsToCap(store);
      const queuedId = store.actions.show(TOAST_TYPE.INFO, buildPayload());

      store.actions.dismiss(queuedId);

      expect(store.getState().pending).toHaveLength(0);
    });

    it('is a no-op when the queue is empty', () => {
      expect(() => store.actions.dismiss()).not.toThrow();
    });
  });

  describe('markEntered', () => {
    it('flips an entering toast to visible', () => {
      const id = store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());

      store.actions.markEntered(id);

      expect(findVisible(id)?.phase).toBe('visible');
    });
  });

  describe('promise', () => {
    it('skips the loading toast when the promise settles before the grace period', async () => {
      const settled = Promise.resolve(MOCK_PROMISE_VALUE);

      const returned = store.actions.promise(settled, {
        loading: MOCK_LOADING_PAYLOAD,
        success: (value) => ({ ...MOCK_SUCCESS_PAYLOAD, message: value }),
        error: MOCK_ERROR_PAYLOAD,
      });

      expect(returned).toBe(settled);
      await settled;
      await vi.advanceTimersByTimeAsync(0);

      const { visible } = store.getState();
      expect(visible).toHaveLength(1);
      expect(visible[0]?.type).toBe(TOAST_TYPE.SUCCESS);
      expect(visible[0]?.message).toBe(MOCK_PROMISE_VALUE);
    });

    it('shows a loading toast only after the grace period elapses', async () => {
      showPendingPromiseToast(store);

      expect(store.getState().visible).toHaveLength(0);

      await vi.advanceTimersToNextTimerAsync();

      const { visible } = store.getState();
      expect(visible).toHaveLength(1);
      expect(visible[0]?.type).toBe(TOAST_TYPE.INFO);
      expect(visible[0]?.isLoading).toBe(true);
      expect(visible[0]?.title).toBe(MOCK_LOADING_PAYLOAD.title);
      expect(visible[0]?.durationMs).toBeUndefined();
    });

    it('swaps the loading toast to success in place on resolve', async () => {
      const { resolvePromise } = showPendingPromiseToast(store);
      await vi.advanceTimersToNextTimerAsync();
      const loadingId = store.getState().visible[0]?.id;

      resolvePromise(MOCK_PROMISE_VALUE);
      await vi.advanceTimersByTimeAsync(0);

      const { visible } = store.getState();
      expect(visible).toHaveLength(1);
      expect(visible[0]?.id).toBe(loadingId);
      expect(visible[0]?.type).toBe(TOAST_TYPE.SUCCESS);
      expect(visible[0]?.isLoading).toBe(false);
      expect(visible[0]?.title).toBe(MOCK_SUCCESS_PAYLOAD.title);
      expect(visible[0]?.durationMs).toBeGreaterThan(0);
    });

    it('swaps the loading toast to a sticky error on reject', async () => {
      let rejectPromise!: (reason: unknown) => void;
      const pending = new Promise<string>((_resolve, reject) => {
        rejectPromise = reject;
      });
      const returned = store.actions.promise(pending, {
        loading: MOCK_LOADING_PAYLOAD,
        success: MOCK_SUCCESS_PAYLOAD,
        error: MOCK_ERROR_PAYLOAD,
      });
      returned.catch(() => {});

      await vi.advanceTimersToNextTimerAsync();
      rejectPromise(new Error(faker.lorem.sentence()));
      await vi.advanceTimersByTimeAsync(0);

      const [record] = store.getState().visible;
      expect(record?.type).toBe(TOAST_TYPE.ERROR);
      expect(record?.isLoading).toBe(false);
      expect(record?.title).toBe(MOCK_ERROR_PAYLOAD.title);
      expect(record?.durationMs).toBeUndefined();
    });

    it('does not resurrect a loading toast dismissed before it settled', async () => {
      const { resolvePromise } = showPendingPromiseToast(store);
      await vi.advanceTimersToNextTimerAsync();
      const loadingId = store.getState().visible[0]?.id;
      store.actions.dismiss(loadingId);
      await vi.advanceTimersToNextTimerAsync();
      expect(store.getState().visible).toHaveLength(0);

      resolvePromise(MOCK_PROMISE_VALUE);
      await vi.advanceTimersByTimeAsync(0);

      expect(store.getState().visible).toHaveLength(0);
    });
  });

  describe('destroy', () => {
    it('clears pending timers so they never fire after teardown', () => {
      store.actions.show(TOAST_TYPE.SUCCESS, buildPayload());
      const listener = vi.fn();
      store.subscribe(listener);

      store.destroy();
      listener.mockClear();
      vi.advanceTimersByTime(MOCK_TEARDOWN_ADVANCE_MS);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
