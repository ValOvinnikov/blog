'use client';

import { AssetUploadField } from '@platform/components/shared/asset-upload-field';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import {
  ACCEPTED_EMAIL_LOGO_MIME_TYPES,
  quickClientEmailLogoCheck,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import {
  createStagingHandlers,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

export type TEmailLogoFieldProps = {
  kind: TEmailLogoKind;
  label: string;
  hint: string;
  logo: TStagedImage;
  onStage: (logo: TStagedImage) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

// Picking or removing a file only stages it; the page's Save uploads it.
export const EmailLogoField = ({
  kind,
  label,
  hint,
  logo,
  onStage,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TEmailLogoFieldProps) => {
  const t = useTranslations('emailLogoField');

  const validateFile = (file: File): string | undefined => {
    const quickError = quickClientEmailLogoCheck(file);
    if (!quickError) return undefined;
    return quickError.key === 'unsupportedType'
      ? t('unsupportedType')
      : t('tooLarge', { limit: quickError.limit });
  };

  const { onUpload, onClear } = createStagingHandlers(
    onStage,
    t('unexpectedError'),
  );

  return (
    <AssetUploadField
      label={label}
      hint={hint}
      currentUrl={logo.url}
      currentAlt={t(`${kind}.currentAlt`)}
      acceptedMimeTypes={ACCEPTED_EMAIL_LOGO_MIME_TYPES}
      uploadLabel={logo.url ? t(`${kind}.replace`) : t(`${kind}.upload`)}
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
  );
};
