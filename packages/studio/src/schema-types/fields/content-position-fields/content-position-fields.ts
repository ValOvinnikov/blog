import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { alignmentField } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { isNotVariant } from '@blog/studio/schema-types/fields/variant-field/variant-predicate';

type TContentPositionFieldsOptions = {
  splitValue: string;
  bannerValue: string;
  fieldset?: string;
};

export const contentPositionFields = ({
  splitValue,
  bannerValue,
  fieldset,
}: TContentPositionFieldsOptions) => [
  alignmentField({
    name: 'contentPositionSplit',
    title: 'Content Position',
    description: 'Which side of the image the text sits on.',
    list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
    initialValue: CONTENT_ALIGNMENT.LEFT,
    hidden: isNotVariant(splitValue),
    fieldset,
  }),
  alignmentField({
    name: 'contentPositionBanner',
    title: 'Content Position',
    description: 'Where the text sits over the background image.',
    list: [
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ],
    initialValue: CONTENT_ALIGNMENT.LEFT,
    hidden: isNotVariant(bannerValue),
    fieldset,
  }),
];
