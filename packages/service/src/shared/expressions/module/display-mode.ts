import { DISPLAY_MODE, type TDisplayMode } from '@blog/config';
import { z } from 'zod';

export const DISPLAY_MODE_EXPRESSION = `coalesce(displayMode, "${DISPLAY_MODE.GRID}")`;

export const displayModeParser = z.enum(
  Object.values(DISPLAY_MODE) as [TDisplayMode, ...TDisplayMode[]],
);
