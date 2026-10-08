import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

import { brandCardVariants } from './brand-card-variants';

export type TBrandCardProps = {
  tenantId: string;
  logoAssetUrl: string | undefined;
  faviconAssetUrl: string | undefined;
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
  isArchived: boolean;
  archivedNoticeId: string;
};

/** The logo and favicon persist through their own upload actions rather than staging behind Save. */
export const BrandCard = ({
  tenantId,
  logoAssetUrl,
  faviconAssetUrl,
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
          tenantId={tenantId}
          kind="logo"
          label={t('logoFieldLabel')}
          hint={t('logoFieldHint')}
          currentUrl={logoAssetUrl}
          onChange={(url) => onFieldChange('logoAssetUrl', url)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
        <BrandAssetField
          tenantId={tenantId}
          kind="favicon"
          label={t('faviconFieldLabel')}
          hint={t('faviconFieldHint')}
          currentUrl={faviconAssetUrl}
          onChange={(url) => onFieldChange('faviconAssetUrl', url)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>
    </LookCard>
  );
};
