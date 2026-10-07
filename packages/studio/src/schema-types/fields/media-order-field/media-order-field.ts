import { MEDIA_ORDER, type TMediaOrder } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, type StringDefinition } from 'sanity';

const mediaOrderCopy = {
  MOBILE: {
    title: 'Mobile Media Order',
    description:
      'Whether the image comes before or after the text once the columns stack on small screens.',
  },
  STACKED: {
    title: 'Media Order',
    description: 'Whether the image comes before or after the text.',
  },
};

type TMediaOrderFieldOptions = {
  kind: keyof typeof mediaOrderCopy;
  name: string;
  initialValue: TMediaOrder;
  hidden?: StringDefinition['hidden'];
  isRequired?: boolean;
};

export const mediaOrderField = ({
  kind,
  name,
  initialValue,
  hidden,
  isRequired = false,
}: TMediaOrderFieldOptions) =>
  defineField({
    name,
    ...mediaOrderCopy[kind],
    type: 'string',
    options: {
      layout: 'dropdown',
      list: Object.values(MEDIA_ORDER).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue,
    hidden,
    validation: isRequired ? (rule) => rule.required() : undefined,
  });
