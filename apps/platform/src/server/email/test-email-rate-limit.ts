import 'server-only';

const WINDOW_MS = 10 * 60_000;
const MAX_SENDS_PER_WINDOW = 5;

type TWindow = { count: number; startedAt: number };

const windows = new Map<string, TWindow>();

// Per server instance, like apps/web's client-log limiter: it bounds one
// admin's sends on a warm instance, not across the fleet.
export const takeTestEmailSend = (userId: string, now = Date.now()) => {
  for (const [key, window] of windows) {
    if (now - window.startedAt >= WINDOW_MS) windows.delete(key);
  }

  const window = windows.get(userId);
  if (!window) {
    windows.set(userId, { count: 1, startedAt: now });
    return true;
  }
  if (window.count >= MAX_SENDS_PER_WINDOW) return false;

  window.count += 1;
  return true;
};
