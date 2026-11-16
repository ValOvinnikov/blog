import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@shinefold/config/constants';
import { CardAlignmentPicture } from '@shinefold/studio/schema-types/fields/card-alignment-field/card-alignment-picture';
import { tileField } from '@shinefold/studio/schema-types/fields/tile-field/tile-field';
import { toTitleCase } from '@shinefold/utils/primitives';

type TCardAlignmentFieldOptions = {
  initialValue: TContentAlignment;
  hasSpotlight?: boolean;
  isRequired?: boolean;
};

export const cardAlignmentField = ({
  initialValue,
  hasSpotlight = false,
  isRequired = true,
}: TCardAlignmentFieldOptions) =>
  tileField({
    name: 'cardAlignment',
    title: 'Card Alignment',
    description: hasSpotlight
      ? 'Horizontal alignment of the content inside each card. A single item shown as a spotlight keeps its own alignment.'
      : 'Horizontal alignment of the content inside each card.',
    tiles: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER].map((value) => ({
      title: toTitleCase(value),
      value,
    })),
    Picture: CardAlignmentPicture,
    initialValue,
    validation: isRequired ? (rule) => rule.required() : undefined,
  });
