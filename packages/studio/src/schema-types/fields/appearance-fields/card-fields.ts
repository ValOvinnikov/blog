import {
  CARD_STYLE,
  CARD_STYLE_LABEL,
  DENSITY,
  GRID_COLUMNS,
  RADIUS_SCALE,
  RADIUS_SCALE_LABEL,
} from '@blog/config/constants';
import {
  CardStylePicture,
  ColumnsPicture,
  CornersPicture,
  DensityPicture,
} from '@blog/studio/schema-types/fields/appearance-fields/appearance-pictures';
import { tileField } from '@blog/studio/schema-types/fields/tile-field/tile-field';
import type { StringDefinition } from 'sanity';

const SITE_DEFAULT = 'Site default';

export const cardFields = (
  hasColumns: boolean,
  columnsHidden?: StringDefinition['hidden'],
) => [
  tileField({
    name: 'cardStyle',
    title: 'Card Style',
    description:
      "The frame around each card in this section. Leave on Site default to follow the site's look.",
    tiles: Object.values(CARD_STYLE).map((value) => ({
      title: CARD_STYLE_LABEL[value],
      value,
    })),
    emptyTitle: SITE_DEFAULT,
    Picture: CardStylePicture,
  }),
  tileField({
    name: 'radiusScale',
    title: 'Corners',
    description:
      "How rounded this section's cards and images are. Leave on Site default to follow the site's look.",
    tiles: Object.values(RADIUS_SCALE).map((value) => ({
      title: RADIUS_SCALE_LABEL[value],
      value,
    })),
    emptyTitle: SITE_DEFAULT,
    Picture: CornersPicture,
  }),
  tileField({
    name: 'density',
    title: 'Density',
    description:
      "How much room this section's spacing and controls take. Leave on Site default to follow the site's look.",
    tiles: [
      { title: 'Comfortable', value: DENSITY.DEFAULT },
      { title: 'Compact', value: DENSITY.COMPACT },
    ],
    emptyTitle: SITE_DEFAULT,
    Picture: DensityPicture,
  }),
  ...(hasColumns
    ? [
        tileField({
          name: 'columns',
          title: 'Columns',
          description:
            "How many cards sit side by side on wide screens. Leave on Auto to keep the section's usual grid.",
          tiles: [
            { title: 'Two', value: GRID_COLUMNS.TWO },
            { title: 'Three', value: GRID_COLUMNS.THREE },
            { title: 'Four', value: GRID_COLUMNS.FOUR },
          ],
          emptyTitle: 'Auto',
          Picture: ColumnsPicture,
          hidden: columnsHidden,
        }),
      ]
    : []),
];
