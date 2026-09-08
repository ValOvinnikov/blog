import { DISPLAY_MODE } from '@blog/config';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const displayModeField = () =>
  defineField({
    name: 'displayMode',
    title: 'Display Mode',
    type: 'string',
    description:
      "Grid stacks the posts in rows. Carousel puts them in one row the reader swipes or steps through. On a wide screen where every post already fits, the carousel's buttons stay disabled.",
    options: {
      layout: 'radio',
      list: Object.values(DISPLAY_MODE).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: DISPLAY_MODE.GRID,
  });
