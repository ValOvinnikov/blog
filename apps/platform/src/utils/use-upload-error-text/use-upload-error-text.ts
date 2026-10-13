'use client';

import type { TUploadError } from '@platform/server/uploads/upload-error';
import { useTranslations } from 'next-intl';

export const useUploadErrorText = () => {
  const t = useTranslations('uploadErrors');

  return (error: TUploadError): string =>
    'values' in error ? t(error.reason, error.values) : t(error.reason);
};
