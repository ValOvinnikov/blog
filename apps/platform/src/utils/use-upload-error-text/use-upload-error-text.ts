'use client';

import { ACTION_OUTCOME } from '@blog/config';
import {
  UPLOAD_OPERATION,
  UPLOAD_REFUSAL,
  type TUploadOperation,
  type TUploadRefusal,
} from '@platform/constants/upload';
import type { TUploadFailure } from '@platform/server/uploads/upload-error';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { useTranslations } from 'next-intl';

export type TUploadErrorState = {
  failure: TUploadFailure;
  operation: TUploadOperation;
  kind: TBrandAssetKind;
};

const REFUSAL_MESSAGE_KEY = {
  [UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED]: 'uploadsNotConfigured',
  [UPLOAD_REFUSAL.FILE_MISSING]: 'fileMissing',
  [UPLOAD_REFUSAL.FILE_TOO_LARGE]: 'fileTooLarge',
  [UPLOAD_REFUSAL.UNREADABLE_IMAGE]: 'unreadableImage',
  [UPLOAD_REFUSAL.UNRECOGNIZED_TARGET]: 'unrecognizedTarget',
  [UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED]: 'brandImageTypeUnsupported',
  [UPLOAD_REFUSAL.IMAGE_TOO_SMALL]: 'imageTooSmall',
  [UPLOAD_REFUSAL.IMAGE_TOO_LARGE]: 'imageTooLarge',
  [UPLOAD_REFUSAL.FAVICON_NOT_SQUARE]: 'faviconNotSquare',
  [UPLOAD_REFUSAL.SVG_FAVICON_NOT_SQUARE]: 'svgFaviconNotSquare',
  [UPLOAD_REFUSAL.EMAIL_LOGO_SVG]: 'emailLogoSvg',
  [UPLOAD_REFUSAL.EMAIL_LOGO_WEBP]: 'emailLogoWebp',
  [UPLOAD_REFUSAL.EMAIL_LOGO_TYPE_UNSUPPORTED]: 'emailLogoTypeUnsupported',
} satisfies Record<TUploadRefusal, string>;

const SERVER_ERROR_MESSAGE_KEY = {
  [UPLOAD_OPERATION.UPLOAD]: 'uploadFailed',
  [UPLOAD_OPERATION.CLEAR]: 'removeFailed',
} satisfies Record<TUploadOperation, string>;

export const useUploadErrorText = () => {
  const t = useTranslations('uploadErrors');

  return ({ failure, operation, kind }: TUploadErrorState): string =>
    failure.outcome === ACTION_OUTCOME.REFUSED
      ? t(REFUSAL_MESSAGE_KEY[failure.reason], failure.values)
      : t(SERVER_ERROR_MESSAGE_KEY[operation], { kind });
};
