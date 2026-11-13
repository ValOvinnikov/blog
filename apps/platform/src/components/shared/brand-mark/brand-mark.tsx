import type { IWithClassName } from '@blog/config/types';
import { SHINEFOLD_LOGO } from '@blog/utils/shinefold-logo';
import { LogoSvg } from '@platform/components/shared/logo-svg';

import {
  brandMarkVariants,
  type TBrandMarkVariants,
} from './brand-mark-variants';

export type TBrandMarkProps = IWithClassName & {
  ariaLabel: string;
  size?: TBrandMarkVariants['size'];
};

export const BrandMark = ({ ariaLabel, size, className }: TBrandMarkProps) => (
  <LogoSvg
    logo={SHINEFOLD_LOGO.MARK}
    ariaLabel={ariaLabel}
    className={brandMarkVariants({ size, class: className })}
  />
);
