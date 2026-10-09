import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { brandCardVariants } from './brand-card-variants';

export type TBrandCardProps = {
  logo: TStagedImage;
  favicon: TStagedImage;
  repickKinds: readonly TBrandAssetKind[];
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const BrandCard = ({
  logo,
  favicon,
  repickKinds,
  onFieldChange,
  hasUnsavedChanges,
  isArchived,
  archivedNoticeId,
}: TBrandCardProps) => {
  const t = useTranslations('lookForm');
  const hintId = useId();
  const describedBy = isArchived ? `${hintId} ${archivedNoticeId}` : hintId;
  const { uploads, rows, hint } = brandCardVariants();

  return (
    <LookCard
      title={t('brandHeading')}
      description={t('brandImagesDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <div className={uploads()}>
        <div className={rows()}>
          <BrandAssetField
            kind="logo"
            label={t('logoFieldLabel')}
            image={logo}
            onStage={(image) => onFieldChange('logo', image)}
            isRepickNeeded={repickKinds.includes('logo')}
            isDisabled={isArchived}
            aria-describedby={describedBy}
          />
          <BrandAssetField
            kind="favicon"
            label={t('faviconFieldLabel')}
            image={favicon}
            onStage={(image) => onFieldChange('favicon', image)}
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
