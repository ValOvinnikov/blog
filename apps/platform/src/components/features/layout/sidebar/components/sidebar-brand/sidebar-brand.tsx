import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { useTranslations } from 'next-intl';

export const SidebarBrand = () => {
  const t = useTranslations('sidebar');
  const { brand, brandMeta, brandName, brandTagline } = sidebarVariants();

  return (
    <div className={brand()}>
      <BrandMark />
      <div className={brandMeta()}>
        <span className={brandName()}>{t('brandName')}</span>
        <span className={brandTagline()}>{t('brandTagline')}</span>
      </div>
    </div>
  );
};
