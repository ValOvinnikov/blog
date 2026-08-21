import { homePageSchema } from '@cms/schema-types/documents/pages/home-page';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

describe('homePageSchema modules allow-list', () => {
  it('permits module_postLatest, module_cta, and module_newsletter, and excludes module_postList', () => {
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
      'module_postLatest',
      'module_cta',
      'module_newsletter',
    ]);
    expect(allowedTypes).not.toContain('module_postList');
  });
});
