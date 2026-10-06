import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { localizedListedTextField } from '@blog/studio/schema-types/fields/localized-listed-text-field/localized-listed-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { localizedImageWithAltSchema } from '@blog/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageBlocksFilled } from '@blog/studio/schema-types/validation/validate-default-language-blocks-filled/validate-default-language-blocks-filled';
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
    localizedListedTextField({
      name: 'quote',
      title: 'Quote',
      description: 'Their words, without quotation marks — the site adds them.',
      validation: (rule) =>
        rule.custom(
          validateDefaultLanguageBlocksFilled('A testimonial needs the quote.'),
        ),
    }),
    localizedOneLineTextField({
      name: 'role',
      title: 'Role',
      description:
        'One line under the name — title, company, or both, punctuated as you want it shown.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
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
        subtitle: formatTestimonialByline(name, defaultLanguageValue(role)),
        media: media ?? undefined,
      };
    },
  },
});
