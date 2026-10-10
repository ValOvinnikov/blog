'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { AssetUploadField } from '@platform/components/shared/asset-upload-field';
import { StatusBadge } from '@platform/components/shared/status-badge';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  quickClientImageCheck,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import {
  createStagingHandlers,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { brandAssetFieldVariants } from './brand-asset-field-variants';

export type TBrandAssetFieldProps = {
  kind: TBrandAssetKind;
  label: string;
  image: TStagedImage;
  onStage: (image: TStagedImage) => void;
  isRepickNeeded?: boolean;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

const getFileName = ({ url, file }: TStagedImage): string | undefined => {
  if (file) return file.name;
  if (!url) return undefined;
  return url.split(/[?#]/)[0]?.split('/').at(-1) || undefined;
};

// Picking or removing a file only stages it; the Look page's Save uploads it.
export const BrandAssetField = ({
  kind,
  label,
  image,
  onStage,
  isRepickNeeded = false,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TBrandAssetFieldProps) => {
  const t = useTranslations('brandAssetField');
  const { onUpload, onClear } = createStagingHandlers(
    onStage,
    t('unexpectedError'),
  );
  const { root } = brandAssetFieldVariants();

  const validateFile = (file: File): string | undefined => {
    const quickError = quickClientImageCheck(file, kind);
    if (!quickError) return undefined;
    return quickError.key === 'unsupportedType'
      ? t('unsupportedType')
      : t('tooLarge', { limit: quickError.limit });
  };

  return (
    <div className={root()}>
      <AssetUploadField
        size="sm"
        layout="row"
        label={label}
        fileName={getFileName(image)}
        badge={
          image.file && (
            <StatusBadge tone="plan" hasDot={false}>
              {t('savesWithChanges')}
            </StatusBadge>
          )
        }
        currentUrl={image.url}
        currentAlt={t(`${kind}.currentAlt`)}
        acceptedMimeTypes={ACCEPTED_IMAGE_MIME_TYPES}
        uploadLabel={image.url ? t(`${kind}.replace`) : t(`${kind}.upload`)}
        uploadingLabel={t('uploading')}
        removeLabel={t('remove')}
        unexpectedErrorLabel={t('unexpectedError')}
        onValidateFile={validateFile}
        onUpload={onUpload}
        onClear={onClear}
        onChange={() => undefined}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
      {isRepickNeeded && (
        <Alert type={ALERT_TYPE.WARNING} title={t(`${kind}.pickAgain`)} />
      )}
    </div>
  );
};
