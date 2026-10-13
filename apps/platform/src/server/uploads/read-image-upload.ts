import 'server-only';

import type { TMaybeUndefined } from '@blog/config/types';
import type { TUploadError } from '@platform/server/uploads/upload-error';
import { imageSize } from 'image-size';

export type TImageFormat = { contentType: string; extension: string };

export type TImageUploadValidationResult =
  | { ok: true; asset: TImageFormat & { buffer: Buffer } }
  | { ok: false; error: TUploadError };

type TReadImageUploadResult =
  | {
      ok: true;
      image: {
        buffer: Buffer;
        type: TMaybeUndefined<string>;
        width: number;
        height: number;
      };
    }
  | { ok: false; error: TUploadError };

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
    return { ok: false, error: { reason: 'fileMissing' } };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: { reason: 'fileTooLarge', values: { limit: maxSizeLabel } },
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { type, width, height } = imageSize(buffer);
    return { ok: true, image: { buffer, type, width, height } };
  } catch {
    return { ok: false, error: { reason: 'unreadableImage' } };
  }
};
