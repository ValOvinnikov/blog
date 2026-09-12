import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';

describe('brandVariantField default description', () => {
  it('describes what the tone does instead of restating that the field is required', () => {
    const field = brandVariantField();

    expect(field.description).toBeTruthy();
    expect(field.description).not.toMatch(/required/i);
  });
});
