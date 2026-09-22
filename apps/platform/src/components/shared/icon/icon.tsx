import type { TIconName } from '@blog/config';

import { ICON_REGISTRY } from './icon-registry';
import { iconVariants, type TIconVariants } from './icon-variants';

export type TIconProps = {
  name: TIconName;
  size?: TIconVariants['size'];
  ariaLabel?: string;
  className?: string;
};

export const Icon = ({ name, size, ariaLabel, className }: TIconProps) => {
  const Glyph = ICON_REGISTRY[name];

  if (!Glyph) {
    return null;
  }

  return (
    <Glyph
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={iconVariants({ size, class: className })}
      data-testid="icon"
    />
  );
};
