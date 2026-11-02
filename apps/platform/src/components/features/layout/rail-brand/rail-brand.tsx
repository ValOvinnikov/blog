import { SIZE } from '@blog/config';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { useTranslations } from 'next-intl';

import { railBrandVariants } from './rail-brand-variants';

export type TRailBrandProps = {
  isWizard?: boolean;
  className?: string;
};

export const RailBrand = ({ isWizard = false, className }: TRailBrandProps) => {
  const t = useTranslations('onboardingPage');
  const { root, phoneMark, desktopMark, brandName } = railBrandVariants();

  return (
    <div className={root({ class: className })}>
      {isWizard ? (
        <>
          <BrandMark size={SIZE.SM} className={phoneMark()} />
          <BrandMark size={SIZE.LG} className={desktopMark()} />
        </>
      ) : (
        <BrandMark />
      )}
      <span className={brandName()}>{t('brandName')}</span>
    </div>
  );
};
