'use client';

import { AssetUploadField } from '@platform/components/shared/asset-upload-field';
import { clearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import {
  ACCEPTED_EMAIL_LOGO_MIME_TYPES,
  quickClientEmailLogoCheck,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

export type TEmailLogoFieldProps = {
  tenantId: string;
  target: TEmailLogoTarget;
  label: string;
  hint: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Uploads/clears persist immediately through their own server actions,
 * same as the Look tab's `BrandAssetField` — a file selection isn't staged
 * behind a "Save changes" button. Deliberately not the same component:
 * this one enforces email-specific limits (`validateEmailLogoUpload`) and
 * writes to either the tenant's `email_config` row or one template's
 * `email_templates` row, resolved by `target`.
 */
export const EmailLogoField = ({
  tenantId,
  target,
  label,
  hint,
  currentUrl,
  onChange,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TEmailLogoFieldProps) => {
  const t = useTranslations('emailLogoField');
  const lowerLabel = label.toLowerCase();

  const validateFile = (file: File): string | undefined => {
    const quickError = quickClientEmailLogoCheck(file);
    if (!quickError) return undefined;
    return quickError.key === 'unsupportedType'
      ? t('unsupportedType')
      : t('tooLarge', { limit: quickError.limit });
  };

  return (
    <AssetUploadField
      label={label}
      hint={hint}
      currentUrl={currentUrl}
      currentAlt={t('currentAlt', { label: lowerLabel })}
      acceptedMimeTypes={ACCEPTED_EMAIL_LOGO_MIME_TYPES}
      uploadLabel={
        currentUrl
          ? t('replace', { label: lowerLabel })
          : t('upload', { label: lowerLabel })
      }
      uploadingLabel={t('uploading')}
      removeLabel={t('remove')}
      unexpectedErrorLabel={t('unexpectedError')}
      onValidateFile={validateFile}
      onUpload={(formData) => uploadEmailLogoAction(tenantId, target, formData)}
      onClear={() => clearEmailLogoAction(tenantId, target)}
      onChange={onChange}
      isDisabled={isDisabled}
      aria-describedby={ariaDescribedBy}
    />
  );
};
