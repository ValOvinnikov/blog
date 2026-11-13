import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { BrandLogo } from '@platform/components/shared/brand-logo';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { useTranslations } from 'next-intl';

export const SidebarBrand = () => {
  const t = useTranslations('sidebar');
  const { brand, brandExpanded, brandCollapsed, brandTagline } =
    sidebarVariants();
  const brandName = t('brandName');

  return (
    <div className={brand()}>
      <div className={brandExpanded()}>
        <BrandLogo ariaLabel={brandName} />
        <span className={brandTagline()}>{t('brandTagline')}</span>
      </div>
      <BrandMark ariaLabel={brandName} className={brandCollapsed()} />
    </div>
  );
};
