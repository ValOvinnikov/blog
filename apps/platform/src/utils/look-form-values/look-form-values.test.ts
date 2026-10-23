import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
} from '@blog/config';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import {
  applyPresetDefaults,
  countChanges,
  isFieldChanged,
  listLostStagedFiles,
} from './look-form-values';

const LOGO_FILE = new File(['bytes'], 'logo.png', { type: 'image/png' });

describe(applyPresetDefaults, () => {
  it("takes the preset's theme tokens and clears the logo hue", () => {
    const current = {
      ...defaultLookFormValues(),
      accentHue: 12,
      logoHue: 90,
      radiusScale: RADIUS_SCALE.XL,
    };
    const { themeTokens, cardStyle } = PRESET_REGISTRY[PRESET_ID.EDITORIAL];

    expect(applyPresetDefaults(PRESET_ID.EDITORIAL, current)).toMatchObject({
      preset: PRESET_ID.EDITORIAL,
      accentHue: themeTokens.accentHue,
      logoHue: undefined,
      headingFont: themeTokens.headingFont,
      bodyFont: themeTokens.bodyFont,
      radiusScale: themeTokens.radiusScale,
      density: themeTokens.density,
      cardStyle,
    });
  });

  it('keeps the language switcher style and both brand images', () => {
    const logo = { url: MOCK_STAGED_LOGO_BLOB_URL, file: LOGO_FILE };
    const favicon = { url: MOCK_LOGO_URL };
    const current = {
      ...defaultLookFormValues(),
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      logo,
      favicon,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next.languageSwitcherStyle).toBe(LANGUAGE_SWITCHER_STYLE.CODES);
    expect(next.logo).toBe(logo);
    expect(next.favicon).toBe(favicon);
  });
});

describe(isFieldChanged, () => {
  it('compares a plain field by value', () => {
    const a = defaultLookFormValues();

    expect(isFieldChanged('accentHue', a, { ...a })).toBe(false);
    expect(isFieldChanged('accentHue', a, { ...a, accentHue: 12 })).toBe(true);
  });

  it('treats a brand image with the same url and file as unchanged, even as a new object', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL } };

    expect(isFieldChanged('logo', a, b)).toBe(false);
  });

  it('treats a newly staged file as a change', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL, file: LOGO_FILE } };

    expect(isFieldChanged('logo', a, b)).toBe(true);
  });
});

describe(countChanges, () => {
  it('counts nothing between equal values', () => {
    const a = defaultLookFormValues();

    expect(countChanges(a, defaultLookFormValues())).toBe(0);
  });

  it('counts each changed field once, brand images included', () => {
    const a = defaultLookFormValues();
    const b = {
      ...a,
      accentHue: 12,
      radiusScale: RADIUS_SCALE.XL,
      favicon: { url: 'blob:staged-favicon', file: LOGO_FILE },
    };

    expect(countChanges(a, b)).toBe(3);
  });
});

describe(listLostStagedFiles, () => {
  it('lists every brand image that was staged as a file', () => {
    const draft = {
      ...defaultLookFormValues(),
      logo: { url: 'blob:dead', file: {} as File },
      favicon: { url: MOCK_LOGO_URL },
    };

    expect(listLostStagedFiles(draft)).toEqual(['logo']);
  });

  it('lists nothing when no file was staged', () => {
    expect(listLostStagedFiles(defaultLookFormValues())).toEqual([]);
  });
});
