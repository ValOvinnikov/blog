import type { IWithClassName } from '@blog/config/types';
import {
  type IShinefoldLogo,
  SHINEFOLD_LOGO,
  SHINEFOLD_LOGO_COLOR,
  SHINEFOLD_LOGO_CURRENT_COLOR,
} from '@blog/utils/shinefold-logo';
import { LogoSvg } from '@platform/components/shared/logo-svg';

import {
  brandLogoVariants,
  type TBrandLogoVariants,
} from './brand-logo-variants';

const { LIGHT, DARK } = SHINEFOLD_LOGO;

const LOGO_WITH_THEMED_INK: IShinefoldLogo = {
  ...LIGHT,
  shapes: LIGHT.shapes.map((shape) =>
    shape.fill === SHINEFOLD_LOGO_COLOR.INK
      ? { ...shape, fill: SHINEFOLD_LOGO_CURRENT_COLOR }
      : shape,
  ),
};

export type TBrandLogoProps = IWithClassName & {
  ariaLabel: string;
  size?: TBrandLogoVariants['size'];
  isOnDark?: boolean;
};

export const BrandLogo = ({
  ariaLabel,
  size,
  isOnDark = false,
  className,
}: TBrandLogoProps) => (
  <LogoSvg
    logo={isOnDark ? DARK : LOGO_WITH_THEMED_INK}
    ariaLabel={ariaLabel}
    className={brandLogoVariants({ size, isOnDark, class: className })}
  />
);
