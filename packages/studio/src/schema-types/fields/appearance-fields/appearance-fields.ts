import {
  CARD_STYLE,
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
import type { FieldDefinition, FieldGroupDefinition } from 'sanity';

const SITE_DEFAULT = 'Site default';

const CONTENT_GROUP = {
  name: 'content',
  title: 'Content',
  default: true,
} satisfies FieldGroupDefinition;

const APPEARANCE_GROUP = {
  name: 'appearance',
  title: 'Appearance',
} satisfies FieldGroupDefinition;

export const appearanceFieldGroups = [CONTENT_GROUP, APPEARANCE_GROUP];

const sectionStyleFields = [
  tileField({
    name: 'cardStyle',
    title: 'Card Style',
    description:
      "The frame around each card in this section. Leave on Site default to follow the site's look.",
    tiles: [
      { title: 'Accent bar', value: CARD_STYLE.ACCENT_BAR },
      { title: 'Outlined', value: CARD_STYLE.OUTLINED },
      { title: 'Filled', value: CARD_STYLE.FILLED },
      { title: 'Raised', value: CARD_STYLE.RAISED },
      { title: 'Plain', value: CARD_STYLE.PLAIN },
    ],
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
  }),
];

type TAppearanceFieldsOptions = {
  content: readonly FieldDefinition[];
  appearance: readonly FieldDefinition[];
};

const inGroup =
  ({ name }: FieldGroupDefinition) =>
  (field: FieldDefinition): FieldDefinition => ({ ...field, group: name });

export const appearanceFields = ({
  content,
  appearance,
}: TAppearanceFieldsOptions) => [
  ...content.map(inGroup(CONTENT_GROUP)),
  ...[...appearance, ...sectionStyleFields].map(inGroup(APPEARANCE_GROUP)),
];
