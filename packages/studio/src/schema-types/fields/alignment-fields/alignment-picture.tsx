import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import {
  FRAME_CENTER_X,
  FRAME_INSET,
  FRAME_WIDTH,
  HEADING_HEIGHT,
  PictureFrame,
  TEXT_LINE_HEIGHT,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';

const TEXT_ROWS = [
  { y: 6, width: 20, height: HEADING_HEIGHT },
  { y: 13, width: FRAME_WIDTH, height: TEXT_LINE_HEIGHT },
  { y: 17, width: 24, height: TEXT_LINE_HEIGHT },
  { y: 21, width: 16, height: TEXT_LINE_HEIGHT },
];

export const alignedRowX = (
  alignment: TContentAlignment,
  width: number,
  padding = 0,
) =>
  ({
    [CONTENT_ALIGNMENT.LEFT]: FRAME_INSET + padding,
    [CONTENT_ALIGNMENT.CENTER]: FRAME_CENTER_X - width / 2,
    [CONTENT_ALIGNMENT.RIGHT]: FRAME_INSET + FRAME_WIDTH - padding - width,
  })[alignment];

export const AlignmentPicture = ({ value }: { value: TContentAlignment }) => (
  <PictureFrame>
    {TEXT_ROWS.map(({ y, width, height }) => (
      <rect
        key={y}
        x={alignedRowX(value, width)}
        y={y}
        width={width}
        height={height}
      />
    ))}
  </PictureFrame>
);
