import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';

describe('showImagesField', () => {
  it('names a boolean field defaulting to true', () => {
    const field = showImagesField();

    expect(field.name).toBe('showImages');
    expect(field.type).toBe('boolean');
    expect(field.initialValue).toBe(true);
  });

  it('defines no validation rule', () => {
    const field = showImagesField();

    expect(field.validation).toBeUndefined();
  });
});
