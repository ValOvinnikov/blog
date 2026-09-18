import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';

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

  it("defaults the description to the post's image wording", () => {
    expect(showImagesField().description).toBe(
      "Show each post's image on its card.",
    );
  });

  it('uses a supplied description over the default', () => {
    expect(
      showImagesField({ description: 'Show each card its visual.' })
        .description,
    ).toBe('Show each card its visual.');
  });
});
