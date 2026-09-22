import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { inlineTextSchema } from '@blog/studio/schema-types/portable-text/inline-text/inline-text';
import { Quote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const formatTestimonialByline = (name?: string, role?: string): string => {
  if (!name) return 'Unknown';
  return role ? `${name} — ${role}` : name;
};

export const blockTestimonialSchema = defineType({
  name: 'block_testimonial',
  title: 'Testimonial Item',
  type: 'document',
  description:
    'A quote from a client or reader, with who said it — reusable across every Testimonials module on the site.',
  icon: Quote,
  fields: [
    titleField(),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Who said it.',
      validation: (rule) => rule.required().error('Say who said it.'),
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: inlineTextSchema.name,
      description: 'Their words, without quotation marks — the site adds them.',
      validation: (rule) =>
        rule.required().error('A testimonial needs the quote.'),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description:
        'One line under the name — title, company, or both, punctuated as you want it shown.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        'An image for this testimonial — not necessarily a portrait of the person. Without one, the site shows their initials.',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description:
        'Optional. Makes the name a link — their site, or the case study.',
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      name: 'name',
      role: 'role',
      media: 'image',
    },
    prepare({ title, name, role, media }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: formatTestimonialByline(name, role),
        media: media ?? undefined,
      };
    },
  },
});
