import type { TCardImageShape } from '@shinefold/config/constants';
import { ImageShapePicture } from '@shinefold/studio/schema-types/fields/image-shape-field/image-shape-picture';
import { tileField } from '@shinefold/studio/schema-types/fields/tile-field/tile-field';
import { toTitleCase } from '@shinefold/utils/primitives';

type TImageShapeFieldOptions = {
  values: readonly TCardImageShape[];
  initialValue: TCardImageShape;
  subject: string;
};

export const imageShapeField = ({
  values,
  initialValue,
  subject,
}: TImageShapeFieldOptions) =>
  tileField({
    name: 'imageShape',
    title: 'Image Shape',
    description: `How each ${subject} is cropped.`,
    tiles: values.map((value) => ({ title: toTitleCase(value), value })),
    Picture: ImageShapePicture,
    initialValue,
    validation: (rule) => rule.required(),
  });
