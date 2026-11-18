import { MEDIA_ORDER, type TMediaOrder } from '@shinefold/config/constants';
import { toTitleCase } from '@shinefold/utils/primitives';
import { defineField, type StringDefinition } from 'sanity';

const STACKED_COPY = {
  title: 'Media Order',
  description: 'Whether the image comes before or after the text.',
};

const MOBILE_COPY = {
  title: 'Mobile Media Order',
  description:
    'Whether the image comes before or after the text once the columns stack on small screens.',
};

type TMediaOrderFieldOptions = {
  isAlwaysStacked: boolean;
  name: string;
  initialValue: TMediaOrder;
  hidden?: StringDefinition['hidden'];
  isRequired?: boolean;
};

export const mediaOrderField = ({
  isAlwaysStacked,
  name,
  initialValue,
  hidden,
  isRequired = false,
}: TMediaOrderFieldOptions) =>
  defineField({
    name,
    ...(isAlwaysStacked ? STACKED_COPY : MOBILE_COPY),
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
