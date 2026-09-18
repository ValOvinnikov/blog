import {
  FULL_BRAND_VARIANT_LIST,
  HERO_VARIANT,
  PROFILE_IMAGE_SOURCE,
  type THeroVariant,
  type TProfileImageSource,
} from '@blog/config/constants';
import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { heroContentPositionFields } from '@blog/studio/schema-types/fields/hero-content-position-fields/hero-content-position-fields';
import { heroMediaOrderSplitField } from '@blog/studio/schema-types/fields/hero-media-order-fields/hero-media-order-fields';
import { heroVariantField } from '@blog/studio/schema-types/fields/hero-variant-field/hero-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { heroFieldsets } from '@blog/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { toTitleCase } from '@blog/utils/primitives';
import { UserCircle } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

type THeroProfileDocument = {
  variant?: THeroVariant;
  imageSource?: TProfileImageSource;
  author?: { _ref?: string };
  showSocialLinks?: boolean;
};

type TResolvedAuthor = {
  image: unknown;
  socialLinks: unknown[] | null;
};

const asHeroProfileDocument = (
  document: SanityDocument | undefined,
): THeroProfileDocument | undefined =>
  document as THeroProfileDocument | undefined;

const fetchAuthor = async (
  document: THeroProfileDocument,
  context: ValidationContext,
): Promise<TResolvedAuthor | null> => {
  const ref = document.author?._ref;

  if (!ref) return null;

  const client = getDraftsClient(context);

  return client.fetch<TResolvedAuthor | null>(
    `*[_id == $id][0]{ image, socialLinks }`,
    { id: ref },
  );
};

const validateVariantRequiresPhoto = (
  document: SanityDocument | undefined,
): string | true => {
  const doc = asHeroProfileDocument(document);
  const variantNeedsPhoto =
    doc?.variant === HERO_VARIANT.SPLIT || doc?.variant === HERO_VARIANT.BANNER;

  return variantNeedsPhoto && doc?.imageSource === PROFILE_IMAGE_SOURCE.NONE
    ? 'These variants are built around a photo.'
    : true;
};

const validateAuthorHasPhoto = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asHeroProfileDocument(document);

  if (doc?.imageSource !== PROFILE_IMAGE_SOURCE.AUTHOR) return true;

  const author = await fetchAuthor(doc, context);

  return author && !author.image
    ? 'This author has no photo yet, so the hero renders without one.'
    : true;
};

const validateAuthorHasSocialLinks = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asHeroProfileDocument(document);

  if (!doc?.showSocialLinks) return true;

  const author = await fetchAuthor(doc, context);

  return author && (!author.socialLinks || author.socialLinks.length === 0)
    ? 'This author has no social links yet, so none will show.'
    : true;
};

const FIELDSET_IMAGE = 'image';

export const heroProfileSchema = defineType({
  name: 'module_heroProfile',
  title: 'Profile Hero',
  type: 'document',
  description:
    'A hero built around a person — their photo and social profiles drawn from an author, alongside a heading and actions you write yourself. Use it to introduce a specific author or team member.',
  icon: UserCircle,
  fieldsets: [
    {
      name: FIELDSET_IMAGE,
      title: 'Image',
      description: "Where the hero's image comes from.",
    },
    ...heroFieldsets,
  ],
  validation: (rule) => [
    rule.custom(validateVariantRequiresPhoto),
    rule.custom(validateAuthorHasPhoto).warning(),
    rule.custom(validateAuthorHasSocialLinks).warning(),
  ],
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    headingBlockField(),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Short line above the heading.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      description:
        "The person this hero introduces. Supplies the hero's photo and social profiles.",
      to: [{ type: authorSchema.name }],
      validation: (rule) =>
        rule.required().error('Choose the person this hero introduces.'),
    }),
    defineField({
      name: 'imageSource',
      title: 'Source',
      type: 'string',
      description: "The author's own photo, a custom image, or no image.",
      fieldset: FIELDSET_IMAGE,
      options: {
        layout: 'dropdown',
        list: Object.values(PROFILE_IMAGE_SOURCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: PROFILE_IMAGE_SOURCE.AUTHOR,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Custom Image',
      type: imageWithAltSchema.name,
      description: 'Used when Source is Custom.',
      fieldset: FIELDSET_IMAGE,
      hidden: ({ parent }) =>
        (parent as THeroProfileDocument | undefined)?.imageSource !==
        PROFILE_IMAGE_SOURCE.CUSTOM,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as THeroProfileDocument | undefined;

          return parent?.imageSource === PROFILE_IMAGE_SOURCE.CUSTOM && !value
            ? 'A custom image is required when Source is Custom.'
            : true;
        }),
    }),
    ctaButtonsField(),
    defineField({
      name: 'showSocialLinks',
      title: 'Show Social Links',
      type: 'boolean',
      description:
        "Whether to display the author's social profile links in this hero.",
      initialValue: true,
    }),
    heroVariantField(),
    ...heroContentPositionFields(),
    heroMediaOrderSplitField(),
    heroLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: subtitle ? String(subtitle) : 'No heading yet',
      };
    },
  },
});
