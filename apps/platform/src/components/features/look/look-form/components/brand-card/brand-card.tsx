import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { brandCardVariants } from './brand-card-variants';

export const BrandCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { logo, favicon },
    updateField,
    repickKinds,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const hintId = useId();
  const describedBy = [hintId, archivedDescribedBy].filter(Boolean).join(' ');
  const { uploads, rows, hint } = brandCardVariants();

  return (
    <LookCard
      card="brand"
      title={t('brandHeading')}
      description={t('brandImagesDescription')}
    >
      <div className={uploads()}>
        <div className={rows()}>
          <BrandAssetField
            kind="logo"
            image={logo}
            onStage={(image) => updateField('logo', image)}
            isRepickNeeded={repickKinds.includes('logo')}
            isDisabled={isArchived}
            aria-describedby={describedBy}
          />
          <BrandAssetField
            kind="favicon"
            image={favicon}
            onStage={(image) => updateField('favicon', image)}
            isRepickNeeded={repickKinds.includes('favicon')}
            isDisabled={isArchived}
            aria-describedby={describedBy}
          />
        </div>
        <p id={hintId} className={hint()}>
          {t('brandFieldsHint')}
        </p>
      </div>
    </LookCard>
  );
};
