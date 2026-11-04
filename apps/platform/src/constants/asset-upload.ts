import type { TValueOf } from '@blog/config/utils';

export const ASSET_UPLOAD_LAYOUT = {
  FRAMED: 'FRAMED',
  BARE: 'BARE',
} as const;

export type TAssetUploadLayout = TValueOf<typeof ASSET_UPLOAD_LAYOUT>;

export const ASSET_UPLOAD_THUMB_TEST_ID = 'asset-upload-thumb';

export const ASSET_UPLOAD_INPUT_TEST_ID = 'asset-upload-field-input';
