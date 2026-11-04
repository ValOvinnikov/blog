import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
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
    values: { logo, favicon },
    updateField,
    repickKinds,
    brandAssetFieldIds,
    brandImageError,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const hintId = useId();
  const describedBy = joinIds(hintId, archivedDescribedBy);
  const { uploads, rows, hint } = brandCardVariants();
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
      title={t('brandHeading')}
      description={t('brandImagesDescription')}
    >
      <div className={uploads()}>
        <div className={rows()}>
          <BrandAssetField
            {...fieldProps('logo')}
            image={logo}
            onStage={(image) => updateField('logo', image)}
          />
          <BrandAssetField
            {...fieldProps('favicon')}
            image={favicon}
            onStage={(image) => updateField('favicon', image)}
          />
        </div>
        <p id={hintId} className={hint()}>
          {t('brandFieldsHint')}
        </p>
      </div>
    </LookCard>
  );
};
