import { isUndefined } from '@shinefold/utils/primitives';

export const respondWith = (status: number, body?: unknown) =>
  vi
    .fn()
    .mockResolvedValue(
      new Response(isUndefined(body) ? null : JSON.stringify(body), { status }),
    );
