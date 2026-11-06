import { BRAND_NAME_MAX_LENGTH } from '@blog/db/constants';
import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { brandCardVariants } from './brand-card-variants';

export type TBrandCardProps = {
  summary: string;
};

export const BrandCard = ({ summary }: TBrandCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    tenantName,
    values: { brandName, logo, favicon },
    updateField,
    brandNameFieldId,
    isBrandNameTooLong,
    repickKinds,
    brandAssetFieldIds,
    brandImageError,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const hintId = useId();
  const describedBy = joinIds(hintId, archivedDescribedBy);

  const fieldProps = (kind: TBrandAssetKind) => ({
    kind,
    isRepickNeeded: repickKinds.includes(kind),
    control: {
      id: brandAssetFieldIds[kind],
      isDisabled: isArchived,
      describedBy,
    },
    error: brandImageError?.kind === kind ? brandImageError.message : undefined,
  });

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.BRAND}
      description={t('brandImagesDescription')}
    >
      <LookField
        field="brandName"
        label={t('brandNameLabel')}
        hint={t('brandNameHint')}
        error={
          isBrandNameTooLong
            ? t('brandNameTooLong', { max: BRAND_NAME_MAX_LENGTH })
            : undefined
        }
        isDisabled={isArchived}
      >
        <FormFieldControlProvider
          id={brandNameFieldId}
          describedBy={archivedDescribedBy}
        >
          <TextInput
            placeholder={tenantName}
            value={brandName}
            onChange={(value) => updateField('brandName', value)}
          />
        </FormFieldControlProvider>
      </LookField>
      <p id={hintId} className={brandCardVariants()}>
        {t('brandFieldsHint')}
      </p>
      <LookField field="logo" label={t('logoFieldLabel')} isGroup={true}>
        <BrandAssetField
          {...fieldProps('logo')}
          image={logo}
          onStage={(image) => updateField('logo', image)}
        />
      </LookField>
      <LookField field="favicon" label={t('faviconFieldLabel')} isGroup={true}>
        <BrandAssetField
          {...fieldProps('favicon')}
          image={favicon}
          onStage={(image) => updateField('favicon', image)}
        />
      </LookField>
    </LookCard>
  );
};
