import 'server-only';

import { ACTION_OUTCOME } from '@blog/config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import type { TUploadFailure } from '@platform/server/uploads/upload-error';
import { env } from '@platform/utils/env/env';

type TReadUploadedFileResult =
  | { ok: true; file: File; token: string }
  | { ok: false; error: TUploadFailure };

export const readUploadedFile = (
  formData: FormData,
): TReadUploadedFileResult => {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
      },
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return {
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_MISSING,
      },
    };
  }

  return { ok: true, file, token };
};
