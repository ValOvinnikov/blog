import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';

describe('showImagesField', () => {
  it('names a boolean field defaulting to true', () => {
    const field = showImagesField();

    expect(field.name).toBe('showImages');
    expect(field.type).toBe('boolean');
    expect(field.initialValue).toBe(true);
  });

  it('requires a value', () => {
    const field = showImagesField();

    if (!field.validation) {
      throw new Error('Expected showImagesField to define validation.');
    }

    const rule = { required: () => 'required-rule' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    const result = (field.validation as any)(rule);

    expect(result).toBe('required-rule');
  });
});
