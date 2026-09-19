import type { FieldsetDefinition } from 'sanity';

export const HERO_FIELDSET_CONTENT_POSITION = 'contentPosition';

export const heroFieldsets: FieldsetDefinition[] = [
  {
    name: HERO_FIELDSET_CONTENT_POSITION,
    title: 'Content Position',
    description: 'Where the text sits in the hero and how it is aligned.',
  },
];
