import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { defineField, type ReferenceRule } from 'sanity';

type TLinkReferenceFieldOptions = {
  name?: string;
  title?: string;
  description: string;
  isRequired?: boolean;
};

export const linkReferenceField = ({
  name = 'link',
  title = 'Link',
  description,
  isRequired = false,
}: TLinkReferenceFieldOptions) =>
  defineField({
    name,
    title,
    type: 'reference',
    description,
    to: [{ type: linkSchema.name }],
    ...(isRequired && {
      validation: (rule: ReferenceRule) => rule.required(),
    }),
  });
