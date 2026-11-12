import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import {
  FAINT,
  FRAME_CENTER_X,
  FRAME_INSET,
  FRAME_WIDTH,
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

const rowX = (alignment: TContentAlignment, width: number) =>
  ({
    [CONTENT_ALIGNMENT.LEFT]: FRAME_INSET + PADDING,
    [CONTENT_ALIGNMENT.CENTER]: FRAME_CENTER_X - width / 2,
    [CONTENT_ALIGNMENT.RIGHT]: FRAME_INSET + FRAME_WIDTH - PADDING - width,
  })[alignment];

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
        x={rowX(value, width)}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
      />
    ))}
  </PictureFrame>
);
