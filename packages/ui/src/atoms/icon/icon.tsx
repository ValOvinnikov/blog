import type { IWithDataTestId, TIconName } from '@blog/config';
import { type SVGProps } from 'react';

import { ICON_REGISTRY } from './icon-registry';
import { iconVariants } from './icon-variants';

export interface IIconProps
  extends Omit<SVGProps<SVGSVGElement>, 'name'>, IWithDataTestId {
  name: TIconName;
  size?: number;
  strokeWidth?: number;
}

/**
 * Icon — renders any icon from the bespoke icon set by name. Prop-compatible
 * with the lucide-react icons it replaces (`size`/`strokeWidth`/`aria-*`), so
 * call sites swap 1:1. Each SVG already carries its own fill/stroke/
 * currentColor styling — this component has no stroke-vs-fill branching, it
 * just looks up and renders the matching SVGR component from the registry.
 */
export const Icon = ({
  name,
  size = 24,
  strokeWidth,
  className,
  dataTestId,
  ...rest
}: IIconProps) => {
  const { component: IconGlyph } = ICON_REGISTRY[name];

  return (
    <IconGlyph
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={iconVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
