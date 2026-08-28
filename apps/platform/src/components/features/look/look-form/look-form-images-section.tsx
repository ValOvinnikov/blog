'use client';

import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { useTranslations } from 'next-intl';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormImagesSectionProps = {
  tenantSlug: string;
  logoAssetUrl: string | undefined;
  faviconAssetUrl: string | undefined;
  onFieldChange: TLookFormFieldSetter;
};

/** The logo and favicon upload fields — independent of preset, so they persist immediately through their own actions rather than staging behind Save. */
export const LookFormImagesSection = ({
  tenantSlug,
  logoAssetUrl,
  faviconAssetUrl,
  onFieldChange,
}: TLookFormImagesSectionProps) => {
  const t = useTranslations('lookForm');
  const { field, fieldLabel, fieldHint, uploads } = lookFormVariants();

  return (
    <div className={field()}>
      <span className={fieldLabel()}>{t('brandImagesLabel')}</span>
      <p className={fieldHint()}>{t('brandImagesDescription')}</p>
      <div className={uploads()}>
        <BrandAssetField
          tenantSlug={tenantSlug}
          kind="logo"
          label={t('logoFieldLabel')}
          hint={t('logoFieldHint')}
          currentUrl={logoAssetUrl}
          onChange={(url) => onFieldChange('logoAssetUrl', url)}
        />
        <BrandAssetField
          tenantSlug={tenantSlug}
          kind="favicon"
          label={t('faviconFieldLabel')}
          hint={t('faviconFieldHint')}
          currentUrl={faviconAssetUrl}
          onChange={(url) => onFieldChange('faviconAssetUrl', url)}
        />
      </div>
    </div>
  );
};
