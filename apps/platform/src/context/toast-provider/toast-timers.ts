import type { TMaybeUndefined } from '@blog/config';

interface ITimerEntry {
  timeoutId: TMaybeUndefined<ReturnType<typeof setTimeout>>;
  remainingMs: number;
  startedAt: number;
  onExpire: () => void;
}

export const createToastTimers = () => {
  const entries = new Map<string, ITimerEntry>();

  const arm = (id: string, entry: ITimerEntry) => {
    entries.set(id, {
      ...entry,
      startedAt: Date.now(),
      timeoutId: setTimeout(() => {
        entries.delete(id);
        entry.onExpire();
      }, entry.remainingMs),
    });
  };

  const clear = (id: string) => {
    const entry = entries.get(id);
    if (!entry) return;

    clearTimeout(entry.timeoutId);
    entries.delete(id);
  };

  const start = (id: string, durationMs: number, onExpire: () => void) => {
    clear(id);
    arm(id, {
      timeoutId: undefined,
      remainingMs: durationMs,
      startedAt: Date.now(),
      onExpire,
    });
  };

  const pause = (id: string) => {
    const entry = entries.get(id);
    if (entry?.timeoutId === undefined) return;

    clearTimeout(entry.timeoutId);
    entries.set(id, {
      ...entry,
      timeoutId: undefined,
      remainingMs: Math.max(
        entry.remainingMs - (Date.now() - entry.startedAt),
        0,
      ),
    });
  };

  const resume = (id: string) => {
    const entry = entries.get(id);
    if (!entry || entry.timeoutId !== undefined) return;

    arm(id, entry);
  };

  const clearAll = () => {
    for (const entry of entries.values()) clearTimeout(entry.timeoutId);
    entries.clear();
  };

  return { start, pause, resume, clear, clearAll };
};
