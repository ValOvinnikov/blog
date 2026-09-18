import type { FieldsetDefinition } from 'sanity';

export const HERO_FIELDSET_CONTENT_POSITION = 'contentPosition';

/** The fieldset every hero kind declares to group its position/alignment fields. */
export const heroFieldsets: FieldsetDefinition[] = [
  {
    name: HERO_FIELDSET_CONTENT_POSITION,
    title: 'Content Position',
    description: 'Where the text sits in the hero and how it is aligned.',
  },
];
