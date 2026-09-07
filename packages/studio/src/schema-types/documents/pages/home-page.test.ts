import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

describe('homePageSchema modules allow-list', () => {
  it('permits every modules[] module type', () => {
    const modulesField = homePageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected homePageSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_content',
      'module_cta',
      'module_newsletter',
      'module_postLatest',
      'module_taxonomyList',
    ]);
    expect(allowedTypes).not.toContain('module_postList');
  });
});

describe('homePageSchema hero field', () => {
  it('is a required reference to the hero family', () => {
    const heroField = homePageSchema.fields?.find(
      (field) => field.name === 'hero',
    ) as { type: string; to?: Array<{ type: string }> } | undefined;

    if (!heroField) {
      throw new Error('Expected homePageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
  });
});
