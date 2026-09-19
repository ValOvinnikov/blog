'use client';

import { AssetUploadField } from '@platform/components/shared/asset-upload-field';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  quickClientImageCheck,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

export type TBrandAssetFieldProps = {
  tenantId: string;
  kind: TBrandAssetKind;
  label: string;
  hint: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Uploads/clears persist immediately through their own server actions —
 * unlike the rest of the Look tab, a file selection isn't staged behind
 * "Save changes", the same way any native upload control takes effect right
 * away. On failure `onChange` is never called, so the previously saved
 * value (and its thumbnail) stays displayed.
 */
export const BrandAssetField = ({
  tenantId,
  kind,
  label,
  hint,
  currentUrl,
  onChange,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TBrandAssetFieldProps) => {
  const t = useTranslations('brandAssetField');
  const lowerLabel = label.toLowerCase();

  return (
    <AssetUploadField
      size={kind === 'favicon' ? 'sm' : 'md'}
      label={label}
      hint={hint}
      currentUrl={currentUrl}
      currentAlt={t('currentAlt', { label: lowerLabel })}
      acceptedMimeTypes={ACCEPTED_IMAGE_MIME_TYPES}
      uploadLabel={
        currentUrl
          ? t('replace', { label: lowerLabel })
          : t('upload', { label: lowerLabel })
      }
      uploadingLabel={t('uploading')}
      removeLabel={t('remove')}
      unexpectedErrorLabel={t('unexpectedError')}
      onValidateFile={(file) => quickClientImageCheck(file, kind)}
      onUpload={(formData) => uploadBrandAssetAction(tenantId, kind, formData)}
      onClear={() => clearBrandAssetAction(tenantId, kind)}
      onChange={onChange}
      isDisabled={isDisabled}
      aria-describedby={ariaDescribedBy}
    />
  );
};
