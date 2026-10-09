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
  const lowerLabel = label.toLowerCase();
  const { onUpload, onClear } = createStagingHandlers(
    onStage,
    t('unexpectedError'),
  );
  const { root } = brandAssetFieldVariants();

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
        currentAlt={t('currentAlt', { label: lowerLabel })}
        acceptedMimeTypes={ACCEPTED_IMAGE_MIME_TYPES}
        uploadLabel={
          image.url
            ? t('replace', { label: lowerLabel })
            : t('upload', { label: lowerLabel })
        }
        uploadingLabel={t('uploading')}
        removeLabel={t('remove')}
        unexpectedErrorLabel={t('unexpectedError')}
        onValidateFile={(file) => quickClientImageCheck(file, kind)}
        onUpload={onUpload}
        onClear={onClear}
        onChange={() => undefined}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
      {isRepickNeeded && (
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('pickAgain', { label: lowerLabel })}
        />
      )}
    </div>
  );
};
