'use client';

import {
  AssetUploadField,
  type TAssetUploadSpec,
} from '@platform/components/shared/asset-upload-field';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import {
  ACCEPTED_EMAIL_LOGO_MIME_TYPES,
  quickClientEmailLogoCheck,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';

export type TEmailLogoFieldProps = {
  kind: TEmailLogoKind;
  label: string;
  hint: string;
  logo: TStagedImage;
  onStage: (logo: TStagedImage) => void;
};

export const EmailLogoField = ({
  kind,
  label,
  hint,
  logo,
  onStage,
}: TEmailLogoFieldProps) => {
  const t = useTranslations('emailLogoField');
  const { isArchived, isPending, archivedDescribedBy } = useSettingsFormState();

  const asset: TAssetUploadSpec = {
    kind,
    size: 'md',
    acceptedMimeTypes: ACCEPTED_EMAIL_LOGO_MIME_TYPES,
    validateFile: (file) => {
      const quickError = quickClientEmailLogoCheck(file);
      if (!quickError) return undefined;
      return quickError.key === 'unsupportedType'
        ? t('unsupportedType')
        : t('tooLarge', { limit: quickError.limit });
    },
  };

  return (
    <AssetUploadField
      label={label}
      hint={hint}
      image={logo}
      onStage={onStage}
      asset={asset}
      isDisabled={isArchived || isPending}
      aria-describedby={archivedDescribedBy}
    />
  );
};
