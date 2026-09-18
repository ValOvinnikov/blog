import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';

describe('titleField', () => {
  it('lets a caller-supplied description override the default', () => {
    const field = titleField({
      description: 'Internal label shown in the Studio.',
    });

    expect(field.description).toBe('Internal label shown in the Studio.');
  });
});
