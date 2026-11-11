import { Radio } from '@base-ui/react/radio';
import { ICONS } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';

export const TileCheck = ({ className }: IWithClassName) => (
  <Radio.Indicator className={className}>
    <Icon
      name={ICONS.TICK}
      size={ICON_SIZE.XXS}
      strokeWidth={ICON_STROKE_WIDTH.RADIO_TICK}
    />
  </Radio.Indicator>
);
