import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
} from '@shinefold/config/constants';
import type {
  Block_testimonial,
  Module_team,
  Module_testimonial,
  Person,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion, TStarterModule } from './starter-document';
import type { TStarterDocument } from './starter-document-shape';
import {
  keyedReference,
  localizedListedText,
  localizedString,
  moduleHeadingBlock,
} from './starter-fields';
import type { TModuleInput } from './starter-modules';

type TTestimonialCopy = {
  heading: string;
  quotes: readonly { name: string; role: string; quote: readonly string[] }[];
};

type TTeamCopy = {
  heading: string;
  members: readonly { name: string; role: string }[];
};

export function buildTestimonialModule({
  id,
  title,
  locale,
  testimonial: { heading, quotes },
}: TModuleInput & { testimonial: TTestimonialCopy }): TStarterDocumentUnion[] {
  const blocks = quotes.map(
    ({ name, role, quote }, index) =>
      ({
        _id: `${id}Quote${index + 1}`,
        _type: 'block_testimonial',
        title: name,
        name,
        role: localizedString(locale, role),
        quote: localizedListedText(locale, quote),
      }) satisfies TStarterDocument<
        Block_testimonial,
        'title' | 'name' | 'quote'
      >,
  );

  return [
    ...blocks,
    {
      _id: id,
      _type: 'module_testimonial',
      title,
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      testimonials: blocks.map(({ _id }) => keyedReference(_id)),
    } satisfies TStarterModule<Module_testimonial>,
  ];
}

export function buildTeamModule({
  id,
  title,
  locale,
  team: { heading, members },
}: TModuleInput & { team: TTeamCopy }): TStarterDocumentUnion[] {
  const people = members.map(
    ({ name, role }, index) =>
      ({
        _id: `${id}Member${index + 1}`,
        _type: 'person',
        name,
        role: localizedString(locale, role),
      }) satisfies TStarterDocument<Person, 'name'>,
  );

  return [
    ...people,
    {
      _id: id,
      _type: 'module_team',
      title,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      imageShape: CARD_IMAGE_SHAPE.CIRCLE,
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
      members: people.map(({ _id }) => keyedReference(_id)),
    } satisfies TStarterModule<Module_team>,
  ];
}
