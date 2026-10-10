import 'server-only';

import type { TLogContext } from '@blog/insight';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { del } from '@vercel/blob';

// A failed delete only orphans a blob; the caller's write has already landed, so it must not fail the action.
export const deleteBlobBestEffort = async (
  url: string,
  event: string,
  context: TLogContext,
): Promise<void> => {
  if (!env.BLOB_READ_WRITE_TOKEN) return;

  try {
    await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    logger.error(event, { ...context, error });
  }
};
