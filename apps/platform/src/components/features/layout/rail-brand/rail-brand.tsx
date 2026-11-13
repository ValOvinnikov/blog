import { SIZE } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { BrandLogo } from '@platform/components/shared/brand-logo';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { useTranslations } from 'next-intl';

import { railBrandVariants } from './rail-brand-variants';

export type TRailBrandProps = IWithClassName & {
  isWizard?: boolean;
};

export const RailBrand = ({ isWizard = false, className }: TRailBrandProps) => {
  const t = useTranslations('onboardingPage');
  const { root, phoneMark, desktopLogo } = railBrandVariants();
  const brandName = t('brandName');

  return (
    <div className={root({ class: className })}>
      {isWizard ? (
        <>
          <BrandMark
            ariaLabel={brandName}
            size={SIZE.SM}
            className={phoneMark()}
          />
          <BrandLogo
            ariaLabel={brandName}
            isOnDark={true}
            className={desktopLogo()}
          />
        </>
      ) : (
        <BrandLogo ariaLabel={brandName} isOnDark={true} />
      )}
    </div>
  );
};
