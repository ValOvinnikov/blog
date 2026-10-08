import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';

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
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;
  const { uploads } = brandCardVariants();

  return (
    <LookCard
      title={t('brandHeading')}
      description={t('brandImagesDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <div className={uploads()}>
        <BrandAssetField
          kind="logo"
          label={t('logoFieldLabel')}
          hint={t('logoFieldHint')}
          image={logo}
          onStage={(image) => onFieldChange('logo', image)}
          isRepickNeeded={repickKinds.includes('logo')}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
        <BrandAssetField
          kind="favicon"
          label={t('faviconFieldLabel')}
          hint={t('faviconFieldHint')}
          image={favicon}
          onStage={(image) => onFieldChange('favicon', image)}
          isRepickNeeded={repickKinds.includes('favicon')}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>
    </LookCard>
  );
};
