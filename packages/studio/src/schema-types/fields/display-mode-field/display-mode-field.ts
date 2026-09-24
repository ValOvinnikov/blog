import { DISPLAY_MODE } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const displayModeField = (options?: { description?: string }) =>
  defineField({
    name: 'displayMode',
    title: 'Display Mode',
    type: 'string',
    description:
      options?.description ??
      'Grid lays the items out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    options: {
      layout: 'dropdown',
      list: Object.values(DISPLAY_MODE).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: DISPLAY_MODE.GRID,
  });
