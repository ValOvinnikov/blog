'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import {
  AssetUploadField,
  type TAssetUploadSpec,
} from '@platform/components/shared/asset-upload-field';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  quickClientImageCheck,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { brandAssetFieldVariants } from './brand-asset-field-variants';

export type TBrandAssetFieldProps = {
  kind: TBrandAssetKind;
  image: TStagedImage;
  onStage: (image: TStagedImage) => void;
  isRepickNeeded?: boolean;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const BrandAssetField = ({
  kind,
  image,
  onStage,
  isRepickNeeded = false,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TBrandAssetFieldProps) => {
  const t = useTranslations('brandAssetField');
  const tLook = useTranslations('lookForm');
  const { root } = brandAssetFieldVariants();

  const asset: TAssetUploadSpec = {
    kind,
    size: 'sm',
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    validateFile: (file) => {
      const quickError = quickClientImageCheck(file, kind);
      if (!quickError) return undefined;
      return quickError.key === 'unsupportedType'
        ? t('unsupportedType')
        : t('tooLarge', { limit: quickError.limit });
    },
    stagedBadgeLabel: t('savesWithChanges'),
  };

  return (
    <div className={root()}>
      <AssetUploadField
        label={tLook(`${kind}FieldLabel`)}
        image={image}
        onStage={onStage}
        asset={asset}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
      {isRepickNeeded && (
        <Alert type={ALERT_TYPE.WARNING} title={t(`${kind}.pickAgain`)} />
      )}
    </div>
  );
};
