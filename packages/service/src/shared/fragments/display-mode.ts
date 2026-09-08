import { DISPLAY_MODE } from '@blog/config';
import { z } from 'zod';

export const DISPLAY_MODE_EXPRESSION = `coalesce(displayMode, "${DISPLAY_MODE.GRID}")`;

export const displayModeParser = z.enum([
  DISPLAY_MODE.GRID,
  DISPLAY_MODE.CAROUSEL,
]);
