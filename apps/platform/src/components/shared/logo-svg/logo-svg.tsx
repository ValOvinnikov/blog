import type { IWithClassName } from '@blog/config/types';
import type { IShinefoldLogo } from '@blog/utils/shinefold-logo';

export type TLogoSvgProps = IWithClassName & {
  logo: IShinefoldLogo;
  ariaLabel: string;
};

export const LogoSvg = ({
  logo: { viewBox, shapes },
  ariaLabel,
  className,
}: TLogoSvgProps) => (
  <svg
    viewBox={viewBox}
    role="img"
    aria-label={ariaLabel}
    className={className}
  >
    {shapes.map(({ d, fill, fillRule }) => (
      <path key={d} d={d} fill={fill} fillRule={fillRule} />
    ))}
  </svg>
);
