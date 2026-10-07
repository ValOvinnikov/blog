import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

type TVariantFieldOptions<TValue extends string> = {
  values: Readonly<Record<string, TValue>>;
  initialValue: TValue;
  description: string;
  isRequired?: boolean;
};

export const variantField = <TValue extends string>({
  values,
  initialValue,
  description,
  isRequired = true,
}: TVariantFieldOptions<TValue>) =>
  defineField({
    name: 'variant',
    title: 'Shape',
    type: 'string',
    description,
    options: {
      layout: 'dropdown',
      list: Object.values(values).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue,
    validation: isRequired ? (rule) => rule.required() : undefined,
  });
