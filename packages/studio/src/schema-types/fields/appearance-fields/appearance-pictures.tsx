import {
  CARD_STYLE,
  DENSITY,
  GRID_COLUMNS,
  RADIUS_SCALE,
  type TCardStyle,
  type TDensity,
  type TGridColumns,
  type TRadiusScale,
} from '@blog/config/constants';
import {
  FAINT,
  FRAME_HEIGHT,
  FRAME_GAP,
  FRAME_INSET,
  FRAME_WIDTH,
  FrameRect,
  PictureFrame,
  TEXT_LINE_HEIGHT,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';
import type { ReactNode } from 'react';

const CORNER_RADIUS: Record<TRadiusScale, number> = {
  [RADIUS_SCALE.NONE]: 0,
  [RADIUS_SCALE.SM]: 2,
  [RADIUS_SCALE.MD]: 4,
  [RADIUS_SCALE.LG]: 7,
  [RADIUS_SCALE.XL]: 10,
};

const DENSITY_GAP: Record<TDensity, number> = {
  [DENSITY.DEFAULT]: 6,
  [DENSITY.COMPACT]: 3,
};

const COLUMN_COUNT: Record<TGridColumns, number> = {
  [GRID_COLUMNS.TWO]: 2,
  [GRID_COLUMNS.THREE]: 3,
  [GRID_COLUMNS.FOUR]: 4,
};

const TextLines = () => (
  <>
    <rect x={11} y={10} width={20} height={TEXT_LINE_HEIGHT} />
    <rect x={11} y={15} width={14} height={TEXT_LINE_HEIGHT} />
  </>
);

const CARD_FRAME = {
  [CARD_STYLE.ACCENT_BAR]: (
    <>
      <FrameRect />
      <rect x={FRAME_INSET} y={FRAME_INSET} width={3} height={FRAME_HEIGHT} />
    </>
  ),
  [CARD_STYLE.OUTLINED]: <FrameRect />,
  [CARD_STYLE.FILLED]: (
    <FrameRect fill="currentColor" stroke="none" opacity={FAINT} />
  ),
  [CARD_STYLE.RAISED]: (
    <>
      <FrameRect
        x={FRAME_INSET + 2}
        y={FRAME_INSET + 3}
        fill="currentColor"
        stroke="none"
        opacity={FAINT}
      />
      <FrameRect fill="var(--card-bg-color)" />
    </>
  ),
  [CARD_STYLE.PLAIN]: null,
} satisfies Record<TCardStyle, ReactNode>;

export const CardStylePicture = ({ value }: { value: TCardStyle }) => (
  <PictureFrame>
    {CARD_FRAME[value]}
    <TextLines />
  </PictureFrame>
);

export const CornersPicture = ({ value }: { value: TRadiusScale }) => (
  <PictureFrame>
    <FrameRect rx={CORNER_RADIUS[value]} />
  </PictureFrame>
);

export const DensityPicture = ({ value }: { value: TDensity }) => {
  const gap = DENSITY_GAP[value];

  return (
    <PictureFrame>
      {[0, 1, 2].map((row) => (
        <rect
          key={row}
          x={FRAME_INSET}
          y={FRAME_INSET + row * (TEXT_LINE_HEIGHT + gap)}
          width={FRAME_WIDTH}
          height={TEXT_LINE_HEIGHT}
        />
      ))}
    </PictureFrame>
  );
};

export const ColumnsPicture = ({ value }: { value: TGridColumns }) => {
  const count = COLUMN_COUNT[value];
  const columnWidth = (FRAME_WIDTH - FRAME_GAP * (count - 1)) / count;

  return (
    <PictureFrame>
      {Array.from({ length: count }, (_, column) => (
        <rect
          key={column}
          x={FRAME_INSET + column * (columnWidth + FRAME_GAP)}
          y={FRAME_INSET}
          width={columnWidth}
          height={FRAME_HEIGHT}
          opacity={FAINT}
        />
      ))}
    </PictureFrame>
  );
};
