import 'server-only';

import type { TUploadError } from '@platform/server/uploads/upload-error';
import { env } from '@platform/utils/env/env';

type TReadUploadedFileResult =
  { ok: true; file: File; token: string } | { ok: false; error: TUploadError };

export const readUploadedFile = (
  formData: FormData,
): TReadUploadedFileResult => {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, error: { reason: 'uploadsNotConfigured' } };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: { reason: 'fileMissing' } };
  }

  return { ok: true, file, token };
};
