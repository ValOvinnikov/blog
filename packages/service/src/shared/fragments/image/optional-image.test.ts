import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { sanityImageFragment } from './image';
import { localizedImageWithAltFragment } from './localized-image-with-alt';
import { optionalImage } from './optional-image';

const { EN, NL } = LOCALE_ISO_CODES;

const asset = {
  _id: 'image-abc123-800x600-jpg',
  _type: 'sanity.imageAsset',
  metadata: {
    lqip: 'data:image/png;base64,abc123',
    dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
  },
};

const assetReference = { _type: 'reference', _ref: asset._id };

const localizedImageQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('person')
  .slice(0)
  .project((sub) => ({
    image: optionalImage(sub, 'image', localizedImageWithAltFragment),
  }));

const logoQuery = q.star
  .filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    logo: optionalImage(sub, 'brand.logo', sanityImageFragment),
  }));

async function runLocalizedImage(image: unknown) {
  const raw = await evaluateGroqExpression(
    localizedImageQuery.query,
    [{ _id: 'person-1', _type: 'person', name: 'Jane Doe', image }, asset],
    undefined,
    { locale: NL, defaultLocale: EN },
  );

  return localizedImageQuery.parse(raw);
}

async function runLogo(logo: unknown) {
  const raw = await evaluateGroqExpression(
    logoQuery.query,
    [{ _id: 'settings_site', _type: 'settings_site', brand: { logo } }, asset],
    undefined,
  );

  return logoQuery.parse(raw);
}

describe('optionalImage', () => {
  it('projects an image Studio left without an asset as null', async () => {
    const result = await runLocalizedImage({
      _type: 'localizedImageWithAlt',
      alt: [
        { _key: EN, _type: 'internationalizedArrayStringValue', language: EN },
      ],
    });

    expect(result?.image).toBeNull();
  });

  it('projects an absent image as null', async () => {
    const result = await runLocalizedImage(undefined);

    expect(result?.image).toBeNull();
  });

  it('projects a real image with its alt text in the visitor language', async () => {
    const result = await runLocalizedImage({
      _type: 'localizedImageWithAlt',
      alt: localizedStrings({ [EN]: 'Portrait', [NL]: 'Portret' }),
      asset: assetReference,
    });

    expect(result?.image).toMatchObject({
      alt: 'Portret',
      asset: { _id: asset._id },
    });
  });

  it('still fails a real image that is missing its required alt text', async () => {
    await expect(
      runLocalizedImage({
        _type: 'localizedImageWithAlt',
        asset: assetReference,
      }),
    ).rejects.toThrow();
  });

  it('reaches an image on a nested field path', async () => {
    const stub = await runLogo({ _type: 'imageWithAlt', alt: 'Logo' });
    const real = await runLogo({
      _type: 'imageWithAlt',
      alt: 'Logo',
      asset: assetReference,
    });

    expect(stub?.logo).toBeNull();
    expect(real?.logo).toMatchObject({
      alt: 'Logo',
      asset: { _id: asset._id },
    });
  });
});
