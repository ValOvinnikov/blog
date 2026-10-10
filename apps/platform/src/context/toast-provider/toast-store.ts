import { TOAST_TYPE, type TToastType } from '@blog/config';
import type {
  IToastPayload,
  IToastRecord,
} from '@platform/components/shared/toast';

import { createToastTimers } from './toast-timers';

const TOAST_QUEUE_CAP = 4;

const TOAST_DEFAULT_LIFE_MS: Partial<Record<TToastType, number>> = {
  [TOAST_TYPE.SUCCESS]: 3600,
  [TOAST_TYPE.INFO]: 3600,
  [TOAST_TYPE.WARNING]: 5000,
};

const TOAST_PROMISE_GRACE_MS = 400;

const TOAST_MERGE_WINDOW_MS = 1000;

const TOAST_EXIT_ANIMATION_MS = 360;

type TToastPromiseMessage<T> = IToastPayload | ((value: T) => IToastPayload);

export interface IToastPromiseMessages<T> {
  loading: Pick<IToastPayload, 'title' | 'message'>;
  success: TToastPromiseMessage<T>;
  error: TToastPromiseMessage<unknown>;
}

export interface IToastQueueState {
  visible: IToastRecord[];
  pending: IToastRecord[];
}

const EMPTY_STATE: IToastQueueState = { visible: [], pending: [] };

let idCounter = 0;
const generateId = () => `toast-${Date.now()}-${idCounter++}`;

const resolvePayload = <T>(
  message: TToastPromiseMessage<T>,
  value: T,
): IToastPayload => (typeof message === 'function' ? message(value) : message);

const isMergeableType = (type: TToastType) =>
  type === TOAST_TYPE.SUCCESS || type === TOAST_TYPE.INFO;

const resolveDurationMs = (type: TToastType, durationMs?: number) =>
  durationMs ?? TOAST_DEFAULT_LIFE_MS[type];

const applyPayload = (type: TToastType, payload: IToastPayload) => ({
  type,
  title: payload.title,
  message: payload.message,
  time: payload.time,
  action: payload.action,
  durationMs: resolveDurationMs(type, payload.durationMs),
});

export const createToastStore = () => {
  let state: IToastQueueState = EMPTY_STATE;
  const listeners = new Set<() => void>();
  const lifeTimers = createToastTimers();
  const removalTimers = createToastTimers();
  const graceTimers = createToastTimers();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const setState = (next: IToastQueueState) => {
    state = next;
    notify();
  };

  const findVisible = (id: string) => state.visible.find((t) => t.id === id);
  const isVisible = (id: string) => Boolean(findVisible(id));
  const findAny = (id: string) =>
    findVisible(id) ?? state.pending.find((t) => t.id === id);

  const patchRecord = (
    id: string,
    updater: (record: IToastRecord) => IToastRecord,
  ) => {
    const visIndex = state.visible.findIndex((t) => t.id === id);
    if (visIndex !== -1) {
      const nextVisible = [...state.visible];
      nextVisible[visIndex] = updater(nextVisible[visIndex]!);
      setState({ ...state, visible: nextVisible });
      return;
    }

    const pendIndex = state.pending.findIndex((t) => t.id === id);
    if (pendIndex !== -1) {
      const nextPending = [...state.pending];
      nextPending[pendIndex] = updater(nextPending[pendIndex]!);
      setState({ ...state, pending: nextPending });
    }
  };

  const startTimer = (id: string, durationMs: number | undefined) => {
    if (durationMs === undefined) return;

    lifeTimers.start(id, durationMs, () => leave(id));
  };

  const restartTimer = (id: string, durationMs: number | undefined) => {
    lifeTimers.clear(id);
    if (isVisible(id)) startTimer(id, durationMs);
  };

  const leave = (id: string) => {
    lifeTimers.clear(id);
    if (!isVisible(id)) return;

    patchRecord(id, (record) => ({ ...record, phase: 'leaving' }));
    removalTimers.start(id, TOAST_EXIT_ANIMATION_MS, () => remove(id));
  };

  const remove = (id: string) => {
    const nextVisible = state.visible.filter((t) => t.id !== id);
    if (nextVisible.length === state.visible.length) return;

    let nextPending = state.pending;
    const [promotedSource, ...rest] = state.pending;

    if (promotedSource && nextVisible.length < TOAST_QUEUE_CAP) {
      const promoted: IToastRecord = {
        ...promotedSource,
        phase: 'entering',
        createdAt: Date.now(),
      };
      nextVisible.push(promoted);
      nextPending = rest;
      setState({ visible: nextVisible, pending: nextPending });
      startTimer(promoted.id, promoted.durationMs);
      return;
    }

    setState({ visible: nextVisible, pending: nextPending });
  };

  const enqueue = (record: IToastRecord) => {
    if (state.visible.length < TOAST_QUEUE_CAP) {
      setState({ ...state, visible: [...state.visible, record] });
      startTimer(record.id, record.durationMs);
      return;
    }

    const oldestNonErrorIndex = state.visible.findIndex(
      (t) => t.type !== TOAST_TYPE.ERROR,
    );

    if (oldestNonErrorIndex === -1) {
      setState({ ...state, pending: [...state.pending, record] });
      return;
    }

    const evicted = state.visible[oldestNonErrorIndex]!;
    lifeTimers.clear(evicted.id);
    removalTimers.clear(evicted.id);
    const nextVisible = state.visible.filter(
      (_, i) => i !== oldestNonErrorIndex,
    );
    nextVisible.push(record);
    setState({ ...state, visible: nextVisible });
    startTimer(record.id, record.durationMs);
  };

  const buildRecord = (
    type: TToastType,
    payload: IToastPayload,
    now: number,
  ): IToastRecord => ({
    id: generateId(),
    ...applyPayload(type, payload),
    coalesceKey: payload.coalesceKey,
    phase: 'entering',
    paused: false,
    createdAt: now,
  });

  const findByCoalesceKey = (key: string) =>
    state.visible.find((t) => t.coalesceKey === key) ??
    state.pending.find((t) => t.coalesceKey === key);

  const findMergeable = (
    type: TToastType,
    payload: IToastPayload,
    now: number,
  ) => {
    if (typeof payload.message !== 'string') return undefined;

    const matches = (t: IToastRecord) =>
      t.type === type &&
      t.title === payload.title &&
      t.message === payload.message &&
      now - t.createdAt <= TOAST_MERGE_WINDOW_MS;

    return state.visible.find(matches) ?? state.pending.find(matches);
  };

  const show = (type: TToastType, payload: IToastPayload): string => {
    const now = Date.now();

    if (payload.coalesceKey) {
      const existing = findByCoalesceKey(payload.coalesceKey);
      if (existing) {
        patchRecord(existing.id, () => ({
          ...existing,
          ...applyPayload(type, payload),
          count: undefined,
          paused: false,
          createdAt: now,
        }));
        restartTimer(existing.id, resolveDurationMs(type, payload.durationMs));
        return existing.id;
      }
    }

    if (isMergeableType(type)) {
      const existing = findMergeable(type, payload, now);
      if (existing) {
        const nextCount = (existing.count ?? 1) + 1;
        patchRecord(existing.id, () => ({
          ...existing,
          count: nextCount,
          // A kept paused: true would leave the new timer unpausable.
          paused: false,
          createdAt: now,
        }));
        restartTimer(existing.id, existing.durationMs);
        return existing.id;
      }
    }

    const record = buildRecord(type, payload, now);
    enqueue(record);
    return record.id;
  };

  const dismiss = (id?: string) => {
    const targetId = id ?? state.visible.at(-1)?.id;
    if (!targetId) return;

    if (state.pending.some((t) => t.id === targetId)) {
      setState({
        ...state,
        pending: state.pending.filter((t) => t.id !== targetId),
      });
      return;
    }

    leave(targetId);
  };

  const pause = (id: string) => {
    const record = findVisible(id);
    if (!record || record.paused) return;

    lifeTimers.pause(id);
    patchRecord(id, (r) => ({ ...r, paused: true }));
  };

  const resume = (id: string) => {
    const record = findVisible(id);
    if (!record || !record.paused) return;

    lifeTimers.resume(id);
    patchRecord(id, (r) => ({ ...r, paused: false }));
  };

  const markEntered = (id: string) => {
    patchRecord(id, (r) =>
      r.phase === 'entering' ? { ...r, phase: 'visible' } : r,
    );
  };

  const promise = <T>(
    promiseInput: Promise<T>,
    messages: IToastPromiseMessages<T>,
  ): Promise<T> => {
    const id = generateId();
    let shown = false;

    graceTimers.start(id, TOAST_PROMISE_GRACE_MS, () => {
      shown = true;
      enqueue({
        id,
        type: TOAST_TYPE.INFO,
        isLoading: true,
        title: messages.loading.title,
        message: messages.loading.message,
        durationMs: undefined,
        phase: 'entering',
        paused: false,
        createdAt: Date.now(),
      });
    });

    const settle = (type: TToastType, payload: IToastPayload) => {
      graceTimers.clear(id);

      if (!shown) {
        enqueue(buildRecord(type, payload, Date.now()));
        return;
      }

      if (!findAny(id)) return;

      const nextDurationMs = resolveDurationMs(type, payload.durationMs);
      lifeTimers.clear(id);
      patchRecord(id, (r) => ({
        ...r,
        ...applyPayload(type, payload),
        isLoading: false,
        paused: false,
        createdAt: Date.now(),
      }));

      if (isVisible(id)) startTimer(id, nextDurationMs);
    };

    promiseInput.then(
      (value) =>
        settle(TOAST_TYPE.SUCCESS, resolvePayload(messages.success, value)),
      (error: unknown) =>
        settle(TOAST_TYPE.ERROR, resolvePayload(messages.error, error)),
    );

    return promiseInput;
  };

  const destroy = () => {
    lifeTimers.clearAll();
    removalTimers.clearAll();
    graceTimers.clearAll();
    listeners.clear();
  };

  return {
    getState: () => state,
    getServerState: () => EMPTY_STATE,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy,
    actions: { show, dismiss, pause, resume, markEntered, promise },
  };
};
