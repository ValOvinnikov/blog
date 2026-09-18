import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  type THeroVariant,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { HERO_FIELDSET_CONTENT_POSITION } from '@blog/studio/schema-types/fields/hero-fields/hero-fields';

type THeroContentPositionParent = { variant?: string };

const isNotVariant =
  (variant: THeroVariant) =>
  ({ parent }: { parent?: unknown }): boolean =>
    (parent as THeroContentPositionParent | undefined)?.variant !== variant;

export const heroContentPositionFields = () =>
  alignmentFields(
    [
      {
        name: 'contentPositionSplit',
        title: 'Position',
        description: 'Which side of the image the text sits on.',
        allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotVariant(HERO_VARIANT.SPLIT),
        fieldset: HERO_FIELDSET_CONTENT_POSITION,
      },
      {
        name: 'contentPositionBanner',
        title: 'Position',
        description: 'Where the text sits over the background image.',
        allow: [
          CONTENT_ALIGNMENT.LEFT,
          CONTENT_ALIGNMENT.CENTER,
          CONTENT_ALIGNMENT.RIGHT,
        ],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotVariant(HERO_VARIANT.BANNER),
        fieldset: HERO_FIELDSET_CONTENT_POSITION,
      },
    ],
    { fieldset: HERO_FIELDSET_CONTENT_POSITION },
  );
