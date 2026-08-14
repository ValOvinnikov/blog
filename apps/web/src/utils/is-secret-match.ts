import { timingSafeEqual } from 'node:crypto';

/** Constant-time secret comparison — a plain `===` leaks timing information proportional to how many leading characters match. */
export function isSecretMatch(
  provided: string | null,
  expected: string,
): boolean {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
