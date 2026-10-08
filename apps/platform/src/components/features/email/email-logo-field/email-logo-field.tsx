'use client';

import { AssetUploadField } from '@platform/components/shared/asset-upload-field';
import type { TStagedLogo } from '@platform/utils/email-draft/email-draft';
import {
  ACCEPTED_EMAIL_LOGO_MIME_TYPES,
  quickClientEmailLogoCheck,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

export type TEmailLogoFieldProps = {
  label: string;
  hint: string;
  logo: TStagedLogo;
  onStage: (logo: TStagedLogo) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

// Picking or removing a file only stages it; the page's Save uploads it.
export const EmailLogoField = ({
  label,
  hint,
  logo,
  onStage,
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

  const stageFile = async (formData: FormData) => {
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { ok: false as const, error: t('unexpectedError') };
    }
    const url = URL.createObjectURL(file);
    onStage({ url, file });
    return { ok: true as const, url };
  };

  const stageClear = async () => {
    onStage({ url: undefined });
    return { ok: true as const };
  };

  return (
    <AssetUploadField
      label={label}
      hint={hint}
      currentUrl={logo.url}
      currentAlt={t('currentAlt', { label: lowerLabel })}
      acceptedMimeTypes={ACCEPTED_EMAIL_LOGO_MIME_TYPES}
      uploadLabel={
        logo.url
          ? t('replace', { label: lowerLabel })
          : t('upload', { label: lowerLabel })
      }
      uploadingLabel={t('uploading')}
      removeLabel={t('remove')}
      unexpectedErrorLabel={t('unexpectedError')}
      onValidateFile={validateFile}
      onUpload={stageFile}
      onClear={stageClear}
      onChange={() => undefined}
      isDisabled={isDisabled}
      aria-describedby={ariaDescribedBy}
    />
  );
};
