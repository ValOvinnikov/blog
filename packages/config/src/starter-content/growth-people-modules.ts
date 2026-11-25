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
  localizedString,
  moduleHeadingBlock,
  moduleItemDocuments,
} from './starter-fields';
import type { TModuleInput } from './starter-modules';
import { localizedListedText } from './starter-portable-text';

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
  const { documents, references } = moduleItemDocuments(
    id,
    'Quote',
    quotes,
    ({ name, role, quote }, itemId) =>
      ({
        _id: itemId,
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
    ...documents,
    {
      _id: id,
      _type: 'module_testimonial',
      title,
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      testimonials: references,
    } satisfies TStarterModule<Module_testimonial>,
  ];
}

export function buildTeamModule({
  id,
  title,
  locale,
  team: { heading, members },
}: TModuleInput & { team: TTeamCopy }): TStarterDocumentUnion[] {
  const { documents, references } = moduleItemDocuments(
    id,
    'Member',
    members,
    ({ name, role }, itemId) =>
      ({
        _id: itemId,
        _type: 'person',
        name,
        role: localizedString(locale, role),
      }) satisfies TStarterDocument<Person, 'name'>,
  );

  return [
    ...documents,
    {
      _id: id,
      _type: 'module_team',
      title,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      imageShape: CARD_IMAGE_SHAPE.CIRCLE,
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
      members: references,
    } satisfies TStarterModule<Module_team>,
  ];
}
