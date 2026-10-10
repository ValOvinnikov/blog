import 'server-only';

import { imageSize } from 'image-size';

export type TImageFormat = { contentType: string; extension: string };

export type TImageUploadValidationResult =
  | { ok: true; asset: TImageFormat & { buffer: Buffer } }
  | { ok: false; error: string };

type TReadImageUploadResult =
  | {
      ok: true;
      image: {
        buffer: Buffer;
        type: string | undefined;
        width: number;
        height: number;
      };
    }
  | { ok: false; error: string };

export const UNREADABLE_IMAGE_ERROR = "That file isn't a readable image.";

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
    return { ok: false, error: 'Choose a file to upload.' };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `That file is too large — the limit is ${maxSizeLabel}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { type, width, height } = imageSize(buffer);
    return { ok: true, image: { buffer, type, width, height } };
  } catch {
    return { ok: false, error: UNREADABLE_IMAGE_ERROR };
  }
};
