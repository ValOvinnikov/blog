import type { ILogger } from '@shinefold/insight';

export const logger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} satisfies ILogger;
