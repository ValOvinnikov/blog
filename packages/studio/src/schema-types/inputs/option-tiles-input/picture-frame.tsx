import type { IWithChildren } from '@blog/config/react';
import type { SVGProps } from 'react';

const WIDTH = 40;
const HEIGHT = 28;
export const FRAME_INSET = 4;
export const FRAME_WIDTH = WIDTH - FRAME_INSET * 2;
export const FRAME_HEIGHT = HEIGHT - FRAME_INSET * 2;
export const FRAME_CENTER_X = WIDTH / 2;
export const FAINT = 0.25;
export const FRAME_GAP = 2;
export const TEXT_LINE_HEIGHT = 2;
export const HEADING_HEIGHT = 4;

export const PictureFrame = ({ children }: IWithChildren) => (
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

export const FrameRect = (props: SVGProps<SVGRectElement>) => (
  <rect
    x={FRAME_INSET}
    y={FRAME_INSET}
    width={FRAME_WIDTH}
    height={FRAME_HEIGHT}
    fill="none"
    stroke="currentColor"
    {...props}
  />
);
