import { CONTAINER_WIDTH, type TContainerWidth } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { type ConditionalProperty, defineField } from 'sanity';

export const containerWidthField = (
  values: readonly TContainerWidth[] = Object.values(CONTAINER_WIDTH),
  hidden?: ConditionalProperty,
) =>
  defineField({
    name: 'containerWidth',
    title: 'Container Width',
    type: 'string',
    description:
      "How wide this section's content can grow. Leave unset for the default width.",
    options: {
      list: values.map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    hidden,
  });
