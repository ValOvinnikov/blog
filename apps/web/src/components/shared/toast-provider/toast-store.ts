import { TOAST_TYPE, type TToastType } from '@blog/config';
import type { IToastAction } from '@blog/ui/molecules';
import type { ReactNode } from 'react';

/** Visible-slot cap (§9) — a 5th toast evicts the oldest non-error toast. */
export const TOAST_QUEUE_CAP = 4;

/** Default auto-dismiss life per type, in ms (§9) — `undefined` = sticky. */
export const TOAST_DEFAULT_LIFE_MS: Partial<Record<TToastType, number>> = {
  [TOAST_TYPE.SUCCESS]: 3600,
  [TOAST_TYPE.INFO]: 3600,
  [TOAST_TYPE.WARNING]: 5000,
};

/** Grace period before a pending `toast.promise` shows a `loading` toast (§4.6). */
export const TOAST_PROMISE_GRACE_MS = 400;

/** Counter-merge window for identical success/info toasts (§4.2/§9). */
export const TOAST_MERGE_WINDOW_MS = 1000;

/** Exit-animation fallback before a `leaving` toast is actually removed (§5). */
export const TOAST_EXIT_ANIMATION_MS = 360;

export interface IToastPayload {
  command: string;
  state: string;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  /** Overrides the per-type default life; `undefined` keeps the default (or sticky, for error). */
  durationMs?: number;
  /** `(feature, entityId)` toggle-collapse key — a second call with the same key replaces this toast in place (§4.2). */
  coalesceKey?: string;
}

type TToastPromiseMessage<T> = IToastPayload | ((value: T) => IToastPayload);

export interface IToastPromiseMessages<T> {
  loading: Pick<IToastPayload, 'command' | 'state' | 'message'>;
  success: TToastPromiseMessage<T>;
  error: TToastPromiseMessage<unknown>;
}

type TToastPhase = 'entering' | 'visible' | 'leaving';

export interface IToastRecord {
  id: string;
  type: TToastType;
  command: string;
  state: string;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  durationMs?: number;
  coalesceKey?: string;
  phase: TToastPhase;
  paused: boolean;
  /** Set once a counter-merge collapses ≥2 identical toasts (§4.2). */
  count?: number;
  createdAt: number;
}

export interface IToastQueueState {
  visible: IToastRecord[];
  pending: IToastRecord[];
}

interface ITimerEntry {
  timeoutId: ReturnType<typeof setTimeout>;
  remainingMs: number;
  startedAt: number;
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

/**
 * createToastStore — the framework-free state machine behind `ToastProvider`:
 * the visible/pending queue, per-toast auto-dismiss timers (with
 * pause/resume tracking exact remaining time), coalescing (toggle-collapse +
 * counter-merge), the cap/eviction policy, and `toast.promise` in-place
 * swapping. No React, no DOM/rAF — `ToastProvider` subscribes to it via
 * `useSyncExternalStore` and separately owns the enter-transition's
 * double-`requestAnimationFrame` paint timing (a rendering, not a queueing,
 * concern) by calling `markEntered` once the browser has painted the
 * off-screen start state.
 */
export const createToastStore = () => {
  let state: IToastQueueState = EMPTY_STATE;
  const listeners = new Set<() => void>();
  const timers = new Map<string, ITimerEntry>();
  const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const graceTimers = new Set<ReturnType<typeof setTimeout>>();

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

  const clearTimer = (id: string) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer.timeoutId);
      timers.delete(id);
    }
  };

  const clearRemovalTimer = (id: string) => {
    const timeoutId = removalTimers.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      removalTimers.delete(id);
    }
  };

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

    const timeoutId = setTimeout(() => leave(id), durationMs);
    timers.set(id, {
      timeoutId,
      remainingMs: durationMs,
      startedAt: Date.now(),
    });
  };

  const restartTimer = (id: string, durationMs: number | undefined) => {
    clearTimer(id);
    if (isVisible(id)) startTimer(id, durationMs);
  };

  function leave(id: string) {
    clearTimer(id);
    if (!isVisible(id)) return;

    patchRecord(id, (record) => ({ ...record, phase: 'leaving' }));
    clearRemovalTimer(id);
    const removalTimeoutId = setTimeout(
      () => remove(id),
      TOAST_EXIT_ANIMATION_MS,
    );
    removalTimers.set(id, removalTimeoutId);
  }

  function remove(id: string) {
    removalTimers.delete(id);
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
  }

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
    clearTimer(evicted.id);
    clearRemovalTimer(evicted.id);
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
    type,
    command: payload.command,
    state: payload.state,
    message: payload.message,
    time: payload.time,
    action: payload.action,
    durationMs: payload.durationMs ?? TOAST_DEFAULT_LIFE_MS[type],
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
      t.command === payload.command &&
      t.state === payload.state &&
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
          type,
          command: payload.command,
          state: payload.state,
          message: payload.message,
          time: payload.time,
          action: payload.action,
          durationMs: payload.durationMs ?? TOAST_DEFAULT_LIFE_MS[type],
          count: undefined,
          paused: false,
          createdAt: now,
        }));
        restartTimer(
          existing.id,
          payload.durationMs ?? TOAST_DEFAULT_LIFE_MS[type],
        );
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
          // A repeat within the merge window is a fresh "same thing
          // happened again" signal — like the coalesce-key branch above,
          // it un-pauses and re-arms a full-duration timer rather than
          // leaving a stale `paused: true` record with a new timer that
          // continued hovering can no longer stop (`pause()` no-ops once
          // already paused).
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

    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer.timeoutId);
      const elapsed = Date.now() - timer.startedAt;
      timers.set(id, {
        ...timer,
        remainingMs: Math.max(timer.remainingMs - elapsed, 0),
      });
    }

    patchRecord(id, (r) => ({ ...r, paused: true }));
  };

  const resume = (id: string) => {
    const record = findVisible(id);
    if (!record || !record.paused) return;

    const timer = timers.get(id);
    if (timer) {
      const timeoutId = setTimeout(() => leave(id), timer.remainingMs);
      timers.set(id, { ...timer, timeoutId, startedAt: Date.now() });
    }

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

    const graceTimeoutId = setTimeout(() => {
      graceTimers.delete(graceTimeoutId);
      shown = true;
      enqueue({
        id,
        type: TOAST_TYPE.LOADING,
        command: messages.loading.command,
        state: messages.loading.state,
        message: messages.loading.message,
        durationMs: undefined,
        phase: 'entering',
        paused: false,
        createdAt: Date.now(),
      });
    }, TOAST_PROMISE_GRACE_MS);
    graceTimers.add(graceTimeoutId);

    const settle = (type: TToastType, payload: IToastPayload) => {
      graceTimers.delete(graceTimeoutId);
      clearTimeout(graceTimeoutId);

      if (!shown) {
        enqueue(buildRecord(type, payload, Date.now()));
        return;
      }

      if (!findAny(id)) return;

      const nextDurationMs = payload.durationMs ?? TOAST_DEFAULT_LIFE_MS[type];
      clearTimer(id);
      patchRecord(id, (r) => ({
        ...r,
        type,
        command: payload.command,
        state: payload.state,
        message: payload.message,
        time: payload.time,
        action: payload.action,
        durationMs: nextDurationMs,
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
    for (const timer of timers.values()) clearTimeout(timer.timeoutId);
    timers.clear();
    for (const timeoutId of removalTimers.values()) clearTimeout(timeoutId);
    removalTimers.clear();
    for (const timeoutId of graceTimers) clearTimeout(timeoutId);
    graceTimers.clear();
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
