import { CARD_IMAGE_SHAPE, type TCardImageShape } from '@blog/config/constants';
import {
  FAINT,
  FRAME_CENTER_X,
  FRAME_INSET,
  FRAME_WIDTH,
  PictureFrame,
  TEXT_LINE_HEIGHT,
} from '@blog/studio/schema-types/inputs/option-tiles-input/picture-frame';
import type { ReactNode } from 'react';

const IMAGE_SIZE = 12;
const ICON_SIZE = 6;
const CAPTION_WIDTH = 20;
const IMAGE_TO_CAPTION = 4;
const CAPTION_Y = FRAME_INSET + IMAGE_SIZE + IMAGE_TO_CAPTION;

const SHAPE = {
  [CARD_IMAGE_SHAPE.WIDE]: (
    <rect
      x={FRAME_INSET}
      y={FRAME_INSET}
      width={FRAME_WIDTH}
      height={IMAGE_SIZE}
      opacity={FAINT}
    />
  ),
  [CARD_IMAGE_SHAPE.SQUARE]: (
    <rect
      x={FRAME_CENTER_X - IMAGE_SIZE / 2}
      y={FRAME_INSET}
      width={IMAGE_SIZE}
      height={IMAGE_SIZE}
      opacity={FAINT}
    />
  ),
  [CARD_IMAGE_SHAPE.CIRCLE]: (
    <circle
      cx={FRAME_CENTER_X}
      cy={FRAME_INSET + IMAGE_SIZE / 2}
      r={IMAGE_SIZE / 2}
      opacity={FAINT}
    />
  ),
  [CARD_IMAGE_SHAPE.ICON]: (
    <rect
      x={FRAME_CENTER_X - ICON_SIZE / 2}
      y={FRAME_INSET + (IMAGE_SIZE - ICON_SIZE) / 2}
      width={ICON_SIZE}
      height={ICON_SIZE}
      rx={1}
    />
  ),
} satisfies Record<TCardImageShape, ReactNode>;

export const ImageShapePicture = ({ value }: { value: TCardImageShape }) => (
  <PictureFrame>
    {SHAPE[value]}
    <rect
      x={FRAME_CENTER_X - CAPTION_WIDTH / 2}
      y={CAPTION_Y}
      width={CAPTION_WIDTH}
      height={TEXT_LINE_HEIGHT}
    />
  </PictureFrame>
);
