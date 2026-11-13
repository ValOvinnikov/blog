import type { TContentAlignment } from '@blog/config/constants';
import { alignedRowX } from '@blog/studio/schema-types/fields/alignment-fields/alignment-picture';
import {
  FAINT,
  FrameRect,
  PictureFrame,
  TEXT_LINE_HEIGHT,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';

const PADDING = 4;

const CARD_ROWS = [
  { y: 8, width: 10, height: 5, opacity: FAINT },
  { y: 16, width: 18, height: TEXT_LINE_HEIGHT, opacity: 1 },
  { y: 20, width: 12, height: TEXT_LINE_HEIGHT, opacity: 1 },
];

export const CardAlignmentPicture = ({
  value,
}: {
  value: TContentAlignment;
}) => (
  <PictureFrame>
    <FrameRect />
    {CARD_ROWS.map(({ y, width, height, opacity }) => (
      <rect
        key={y}
        x={alignedRowX(value, width, PADDING)}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
      />
    ))}
  </PictureFrame>
);
