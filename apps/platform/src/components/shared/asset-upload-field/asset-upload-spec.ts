import type { TAssetUploadLayout } from '@platform/constants/asset-upload';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { SIZE, TMaybeUndefined } from '@shinefold/config';

export type TAssetUploadSpec = {
  kind: TBrandAssetKind | TEmailLogoKind;
  size: typeof SIZE.SM | typeof SIZE.MD;
  acceptedMimeTypes: readonly string[];
  validateFile: (file: File) => TMaybeUndefined<string>;
  layout?: TAssetUploadLayout;
};

export type TAssetUploadControl = {
  id?: string;
  isDisabled?: boolean;
  isLocked?: boolean;
  describedBy?: string;
};
