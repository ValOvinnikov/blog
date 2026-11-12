import { DISPLAY_MODE, type TDisplayMode } from '@blog/config/constants';
import {
  FAINT,
  FRAME_HEIGHT,
  FRAME_INSET,
  FRAME_WIDTH,
  PictureFrame,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';
import type { ReactNode } from 'react';

const GAP = 2;
const GRID_CELL_WIDTH = (FRAME_WIDTH - GAP) / 2;
const GRID_CELL_HEIGHT = (FRAME_HEIGHT - GAP) / 2;
const SLIDE_WIDTH = 13;
const SLIDE_HEIGHT = 14;
const DOT_Y = FRAME_INSET + SLIDE_HEIGHT + 5;

const GRID_CELLS = [0, 1].flatMap((row) =>
  [0, 1].map((column) => ({ row, column })),
);

const MODE_PICTURE = {
  [DISPLAY_MODE.GRID]: GRID_CELLS.map(({ row, column }) => (
    <rect
      key={`${String(row)}-${String(column)}`}
      x={FRAME_INSET + column * (GRID_CELL_WIDTH + GAP)}
      y={FRAME_INSET + row * (GRID_CELL_HEIGHT + GAP)}
      width={GRID_CELL_WIDTH}
      height={GRID_CELL_HEIGHT}
      opacity={FAINT}
    />
  )),
  [DISPLAY_MODE.CAROUSEL]: (
    <>
      {[0, 1, 2].map((slide) => (
        <rect
          key={slide}
          x={FRAME_INSET + slide * (SLIDE_WIDTH + GAP)}
          y={FRAME_INSET}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          opacity={FAINT}
        />
      ))}
      {[-4, 0, 4].map((offset) => (
        <circle
          key={offset}
          cx={FRAME_INSET + FRAME_WIDTH / 2 + offset}
          cy={DOT_Y}
          r={1}
          opacity={offset === -4 ? 1 : FAINT}
        />
      ))}
    </>
  ),
} satisfies Record<TDisplayMode, ReactNode>;

export const DisplayModePicture = ({ value }: { value: TDisplayMode }) => (
  <PictureFrame>{MODE_PICTURE[value]}</PictureFrame>
);
