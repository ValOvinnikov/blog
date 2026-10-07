import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import { alignmentField } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';

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
  alignmentField({
    name: 'cardAlignment',
    title: 'Card Alignment',
    description: hasSpotlight
      ? 'Horizontal alignment of the content inside each card. A single item shown as a spotlight keeps its own alignment.'
      : 'Horizontal alignment of the content inside each card.',
    list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    initialValue,
    validation: isRequired ? (rule) => rule.required() : undefined,
  });
