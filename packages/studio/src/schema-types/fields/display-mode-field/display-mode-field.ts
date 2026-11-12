import { DISPLAY_MODE } from '@blog/config/constants';
import { DisplayModePicture } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-picture';
import { tileField } from '@blog/studio/schema-types/fields/tile-field/tile-field';
import { toTitleCase } from '@blog/utils/primitives';
import type { StringDefinition } from 'sanity';

export const displayModeField = (options?: {
  description?: string;
  validation?: StringDefinition['validation'];
}) =>
  tileField({
    name: 'displayMode',
    title: 'Display Mode',
    description:
      options?.description ??
      'Grid lays the items out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    tiles: Object.values(DISPLAY_MODE).map((value) => ({
      title: toTitleCase(value),
      value,
    })),
    Picture: DisplayModePicture,
    initialValue: DISPLAY_MODE.GRID,
    validation: options?.validation,
  });
