import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  makeRawLogoItem,
  makeRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { logoWallModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const logoWallDocument = {
  _id: 'logo-wall-1',
  _type: 'module_logoWall',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({ [EN]: 'Trusted by', [NL]: 'Vertrouwd door' }),
  },
  logos: [
    {
      _key: 'logo-1',
      _type: 'logoItem',
      name: 'Acme',
      image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-1' } },
    },
  ],
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runLogoWall(locale: string) {
  const raw = await evaluateGroqExpression(
    logoWallModuleQuery.query,
    [logoWallDocument, imageAsset],
    undefined,
    { id: 'logo-wall-1', locale, defaultLocale: EN },
  );

  return logoWallModuleQuery.parse(raw);
}

describe('logoWallModuleQuery', () => {
  it('filters to module_logoWall documents by id', () => {
    expect(logoWallModuleQuery.query).toContain('_type == "module_logoWall"');
    expect(logoWallModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawLogoWallModule(), headingBlock: null };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no logos', () => {
    const raw = { ...makeRawLogoWallModule(), logos: null };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a logo with no image', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [{ ...makeRawLogoItem(), image: null }],
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a logo with no name', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [{ ...makeRawLogoItem(), name: null }],
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('parses a logo with no link', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [{ ...makeRawLogoItem(), link: null }],
    };

    expect(() => logoWallModuleQuery.parse(raw)).not.toThrow();
    expect(logoWallModuleQuery.parse(raw).logos?.[0]?.link).toBeNull();
  });

  it('parses a logo whose dark-background image has no asset', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [
        {
          ...makeRawLogoItem(),
          imageDark: { asset: null, hotspot: null, crop: null },
        },
      ],
    };

    expect(() => logoWallModuleQuery.parse(raw)).not.toThrow();
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(logoWallModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runLogoWall(NL);

    expect(headingBlock.heading).toBe('Vertrouwd door');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runLogoWall(FR);

    expect(headingBlock.heading).toBe('Trusted by');
  });

  it('reads a logo name the same in every language', async () => {
    const [english, dutch] = await Promise.all([
      runLogoWall(EN),
      runLogoWall(NL),
    ]);

    expect(dutch.logos.map(({ name }) => name)).toEqual(
      english.logos.map(({ name }) => name),
    );
  });
});
