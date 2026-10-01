import { MEDIA_ORDER, type TMediaOrder } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { type ConditionalProperty, defineField, type StringRule } from 'sanity';

type TMediaOrderFieldOptions = {
  name: string;
  title: string;
  description: string;
  initialValue?: TMediaOrder;
  hidden?: ConditionalProperty;
  validation?: (rule: StringRule) => StringRule;
};

export const mediaOrderField = ({
  name,
  title,
  description,
  initialValue,
  hidden,
  validation,
}: TMediaOrderFieldOptions) =>
  defineField({
    name,
    title,
    type: 'string',
    description,
    options: {
      layout: 'dropdown',
      list: Object.values(MEDIA_ORDER).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue,
    hidden,
    validation,
  });
