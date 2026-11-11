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
import type { IWithChildren } from '@blog/config/react';
import type { ReactNode, SVGProps } from 'react';

const WIDTH = 40;
const HEIGHT = 28;
const INSET = 4;
const FRAME_WIDTH = WIDTH - INSET * 2;
const FRAME_HEIGHT = HEIGHT - INSET * 2;
const FAINT = 0.25;

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
  [GRID_COLUMNS.AUTO]: 1,
  [GRID_COLUMNS.TWO]: 2,
  [GRID_COLUMNS.THREE]: 3,
  [GRID_COLUMNS.FOUR]: 4,
};

const PictureFrame = ({ children }: IWithChildren) => (
  <svg
    width={WIDTH}
    height={HEIGHT}
    viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
    fill="currentColor"
    aria-hidden={true}
  >
    {children}
  </svg>
);

const TextLines = () => (
  <>
    <rect x={11} y={10} width={20} height={2} />
    <rect x={11} y={15} width={14} height={2} />
  </>
);

const FrameRect = (props: SVGProps<SVGRectElement>) => (
  <rect
    x={INSET}
    y={INSET}
    width={FRAME_WIDTH}
    height={FRAME_HEIGHT}
    fill="none"
    stroke="currentColor"
    {...props}
  />
);

const CARD_FRAME = {
  [CARD_STYLE.ACCENT_BAR]: (
    <>
      <FrameRect />
      <rect x={INSET} y={INSET} width={3} height={FRAME_HEIGHT} />
    </>
  ),
  [CARD_STYLE.OUTLINED]: <FrameRect />,
  [CARD_STYLE.FILLED]: (
    <FrameRect fill="currentColor" stroke="none" opacity={FAINT} />
  ),
  [CARD_STYLE.RAISED]: (
    <>
      <FrameRect
        x={INSET + 2}
        y={INSET + 3}
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
          x={INSET}
          y={INSET + row * (2 + gap)}
          width={FRAME_WIDTH}
          height={2}
        />
      ))}
    </PictureFrame>
  );
};

export const ColumnsPicture = ({ value }: { value: TGridColumns }) => {
  const count = COLUMN_COUNT[value];
  const gap = 2;
  const columnWidth = (FRAME_WIDTH - gap * (count - 1)) / count;

  return (
    <PictureFrame>
      {Array.from({ length: count }, (_, column) => (
        <rect
          key={column}
          x={INSET + column * (columnWidth + gap)}
          y={INSET}
          width={columnWidth}
          height={FRAME_HEIGHT}
          opacity={FAINT}
        />
      ))}
    </PictureFrame>
  );
};
