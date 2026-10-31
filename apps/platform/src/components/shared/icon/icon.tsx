import { isUndefined } from '@blog/utils/primitives';
import { ICON_SIZE, ICON_TEST_ID } from '@platform/constants/icon';

import { ICON_REGISTRY, type TRegisteredIconName } from './icon-registry';
import { iconVariants, type TIconVariants } from './icon-variants';

export type TIconProps = {
  name: TRegisteredIconName;
  size?: TIconVariants['size'];
  strokeWidth?: number;
  ariaLabel?: string;
  className?: string;
};

export const Icon = ({
  name,
  size = ICON_SIZE.MD,
  strokeWidth,
  ariaLabel,
  className,
}: TIconProps) => {
  const Glyph = ICON_REGISTRY[name];

  return (
    <Glyph
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={iconVariants({ size, class: className })}
      {...(isUndefined(strokeWidth) ? {} : { strokeWidth })}
      data-testid={ICON_TEST_ID}
    />
  );
};
