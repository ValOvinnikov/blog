import { Radio } from '@base-ui/react/radio';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { ICONS } from '@shinefold/config';
import type { IWithClassName } from '@shinefold/config/types';

export const TileCheck = ({ className }: IWithClassName) => (
  <Radio.Indicator className={className}>
    <Icon
      name={ICONS.TICK}
      size={ICON_SIZE.XXS}
      strokeWidth={ICON_STROKE_WIDTH.RADIO_TICK}
    />
  </Radio.Indicator>
);
