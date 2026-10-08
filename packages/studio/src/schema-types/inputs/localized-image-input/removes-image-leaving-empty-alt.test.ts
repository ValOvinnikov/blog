import { removesImageLeavingEmptyAlt } from '@blog/studio/schema-types/inputs/localized-image-input/removes-image-leaving-empty-alt';
import { unset } from 'sanity';

const REMOVE_IMAGE = [unset(['asset']), unset(['media']), unset(['crop'])];

const image = (alt: unknown) => ({
  _type: 'localizedImageWithAlt',
  asset: { _ref: 'image-abc' },
  crop: { top: 0 },
  alt,
});

describe(removesImageLeavingEmptyAlt, () => {
  it('is true when removing the image leaves only an empty alt entry', () => {
    expect(
      removesImageLeavingEmptyAlt(
        image([{ _key: 'EN', language: 'EN' }]),
        REMOVE_IMAGE,
      ),
    ).toBe(true);
  });

  it('is true when removing the image leaves no alt at all', () => {
    expect(removesImageLeavingEmptyAlt(image(undefined), REMOVE_IMAGE)).toBe(
      true,
    );
  });

  it('is false when the alt text is filled in', () => {
    expect(
      removesImageLeavingEmptyAlt(
        image([{ _key: 'NL', language: 'NL', value: 'Een portret' }]),
        REMOVE_IMAGE,
      ),
    ).toBe(false);
  });

  it('is false when another field outlives the removal', () => {
    expect(
      removesImageLeavingEmptyAlt(
        { ...image(undefined), hotspot: { x: 0.5 } },
        REMOVE_IMAGE,
      ),
    ).toBe(false);
  });

  it('is false when the asset is not being removed', () => {
    expect(
      removesImageLeavingEmptyAlt(image(undefined), [unset(['crop'])]),
    ).toBe(false);
  });

  it('is false when there is no value', () => {
    expect(removesImageLeavingEmptyAlt(undefined, REMOVE_IMAGE)).toBe(false);
  });
});
