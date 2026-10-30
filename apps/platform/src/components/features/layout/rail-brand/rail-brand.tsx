import { BrandMark } from '@platform/components/shared/brand-mark';
import { useTranslations } from 'next-intl';

import { railBrandVariants } from './rail-brand-variants';

export type TRailBrandProps = {
  className?: string;
};

export const RailBrand = ({ className }: TRailBrandProps) => {
  const t = useTranslations('onboardingPage');
  const { root, brandName } = railBrandVariants();

  return (
    <div className={root({ class: className })}>
      <BrandMark />
      <span className={brandName()}>{t('brandName')}</span>
    </div>
  );
};
