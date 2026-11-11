import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';

import { checkMarkVariants } from './check-mark-variants';

export type TCheckMarkProps = {
  isDone: boolean;
};

export const CheckMark = ({ isDone }: TCheckMarkProps) => (
  <span className={checkMarkVariants({ isDone })} aria-hidden="true">
    {isDone && (
      <Icon
        name={ICONS.TICK}
        size={ICON_SIZE.XS}
        strokeWidth={ICON_STROKE_WIDTH.CHIP_TICK}
      />
    )}
  </span>
);
