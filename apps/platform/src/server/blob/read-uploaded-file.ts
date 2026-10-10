import 'server-only';

import { env } from '@platform/utils/env/env';

type TReadUploadedFileResult =
  { ok: true; file: File; token: string } | { ok: false; error: string };

export const readUploadedFile = (
  formData: FormData,
): TReadUploadedFileResult => {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: 'File uploads are not configured for this environment yet.',
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'Choose a file to upload.' };
  }

  return { ok: true, file, token };
};
