import 'server-only';

import { ACTION_OUTCOME } from '@blog/config';
import type { TMaybeUndefined } from '@blog/config/types';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import type { TUploadFailure } from '@platform/server/uploads/upload-error';
import { imageSize } from 'image-size';

export type TImageFormat = { contentType: string; extension: string };

export type TImageUploadValidationResult = TResult<
  TImageFormat & { buffer: Buffer },
  TUploadFailure
>;

type TReadImageUploadResult = TResult<
  {
    buffer: Buffer;
    type: TMaybeUndefined<string>;
    width: number;
    height: number;
  },
  TUploadFailure
>;

/**
 * Reads the real header bytes rather than trusting the browser-reported
 * `File.type`/`.size`, which are attacker-controlled.
 */
export const readImageUpload = async (
  file: File,
  maxBytes: number,
  maxSizeLabel: string,
): Promise<TReadImageUploadResult> => {
  if (file.size === 0) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_MISSING,
    });
  }

  if (file.size > maxBytes) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
      values: { limit: maxSizeLabel },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { type, width, height } = imageSize(buffer);
    return okResult({ buffer, type, width, height });
  } catch {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
    });
  }
};
