import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import { alignedRowX } from '@blog/studio/schema-types/fields/alignment-fields/alignment-picture';
import {
  FAINT,
  FRAME_GAP,
  FRAME_HEIGHT,
  FRAME_INSET,
  FRAME_WIDTH,
  FrameRect,
  HEADING_HEIGHT,
  PictureFrame,
  TEXT_LINE_HEIGHT,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';

const COLUMN_WIDTH = (FRAME_WIDTH - FRAME_GAP) / 2;
const BANNER_PADDING = 4;

const TEXT_BLOCK_ROWS = [
  { y: 9, width: 10, height: HEADING_HEIGHT },
  { y: 16, width: COLUMN_WIDTH, height: TEXT_LINE_HEIGHT },
  { y: 20, width: 11, height: TEXT_LINE_HEIGHT },
];

const TextBlock = ({ rowX }: { rowX: (width: number) => number }) => (
  <>
    {TEXT_BLOCK_ROWS.map(({ y, width, height }) => (
      <rect key={y} x={rowX(width)} y={y} width={width} height={height} />
    ))}
  </>
);

export const ContentPositionSplitPicture = ({
  value,
}: {
  value: TContentAlignment;
}) => {
  const isTextOnRight = value === CONTENT_ALIGNMENT.RIGHT;
  const rightColumnX = FRAME_INSET + COLUMN_WIDTH + FRAME_GAP;

  return (
    <PictureFrame>
      <rect
        x={isTextOnRight ? FRAME_INSET : rightColumnX}
        y={FRAME_INSET}
        width={COLUMN_WIDTH}
        height={FRAME_HEIGHT}
        opacity={FAINT}
      />
      <TextBlock rowX={() => (isTextOnRight ? rightColumnX : FRAME_INSET)} />
    </PictureFrame>
  );
};

export const ContentPositionBannerPicture = ({
  value,
}: {
  value: TContentAlignment;
}) => (
  <PictureFrame>
    <FrameRect fill="currentColor" stroke="none" opacity={FAINT} />
    <TextBlock rowX={(width) => alignedRowX(value, width, BANNER_PADDING)} />
  </PictureFrame>
);
