import 'server-only';

import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import type { TUploadFailure } from '@platform/server/uploads/upload-error';
import { env } from '@platform/utils/env/env';
import { ACTION_OUTCOME } from '@shinefold/config';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

type TReadUploadedFileResult = TResult<
  { file: File; token: string },
  TUploadFailure
>;

export const readUploadedFile = (
  formData: FormData,
): TReadUploadedFileResult => {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
    });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_MISSING,
    });
  }

  return okResult({ file, token });
};
