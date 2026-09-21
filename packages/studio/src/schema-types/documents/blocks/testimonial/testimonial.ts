import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { Quote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const formatTestimonialByline = (name?: string, role?: string): string => {
  if (!name) return 'Unknown';
  return role ? `${name} — ${role}` : name;
};

export const blockTestimonialSchema = defineType({
  name: 'block_testimonial',
  title: 'Testimonial',
  type: 'document',
  description:
    'A quote from a client or reader, with who said it — reusable across every Testimonials module on the site.',
  icon: Quote,
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'Their words, without quotation marks — the site adds them.',
      validation: (rule) =>
        rule
          .required()
          .error('A testimonial needs the quote.')
          .max(280)
          .warning(
            'Long quotes make uneven cards — keep it to a couple of sentences.',
          ),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Who said it.',
      validation: (rule) => rule.required().error('Say who said it.'),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description:
        'One line under the name — title, company, or both, punctuated as you want it shown.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: imageWithAltSchema.name,
      description:
        'Shown as a small round portrait beside the name. Without one, the site shows their initials.',
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
      title: 'quote',
      name: 'name',
      role: 'role',
      media: 'photo',
    },
    prepare({ title, name, role, media }) {
      return {
        title: typeof title === 'string' ? title : 'Untitled Testimonial',
        subtitle: formatTestimonialByline(name, role),
        media: media ?? undefined,
      };
    },
  },
});
