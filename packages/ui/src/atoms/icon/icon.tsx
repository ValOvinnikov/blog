import type { IWithDataTestId, TIconName } from '@blog/config';
import { type SVGProps } from 'react';

import { ICON_REGISTRY } from './icon-registry';
import { iconVariants, type TIconVariants } from './icon-variants';

export interface IIconProps
  extends Omit<SVGProps<SVGSVGElement>, 'name'>, IWithDataTestId {
  name: TIconName;
  size?: TIconVariants['size'];
}

/**
 * Icon — renders any icon from the bespoke icon set by name. Each SVG
 * already carries its own fill/stroke/currentColor styling and stroke-width
 * — this component has no stroke-vs-fill branching, it just looks up and
 * renders the matching SVGR component from the registry. Decorative by
 * default: with no `aria-label`, it renders `aria-hidden="true"` so callers
 * don't have to remember it; pass `aria-label` for a meaningful icon, or
 * `aria-hidden` explicitly to override either default.
 */
export const Icon = ({
  name,
  size,
  className,
  dataTestId,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...rest
}: IIconProps) => {
  const { component: IconGlyph } = ICON_REGISTRY[name];
  const resolvedAriaHidden = ariaHidden ?? (ariaLabel ? undefined : true);

  return (
    <IconGlyph
      aria-label={ariaLabel}
      aria-hidden={resolvedAriaHidden}
      className={iconVariants({ size, class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
