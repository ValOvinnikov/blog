import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  CARD_STYLE,
  DENSITY,
  formatOklchRamp,
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  HUE_MAX,
  HUE_MIN,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  RADIUS_SCALE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import {
  accentHueGradient,
  buildAccentPreviewTokens,
  buildLogoPreviewTokens,
  buildSitePreviewTheme,
  buildThemePreviewStyle,
  type TThemePreviewValues,
} from './theme-preview-tokens';

faker.seed(1);

const MOCK_ACCENT_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });
const MOCK_LOGO_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });

const MOCK_PREVIEW_VALUES: TThemePreviewValues = {
  radiusScale: RADIUS_SCALE.SM,
  density: DENSITY.COMPACT,
  cardStyle: CARD_STYLE.OUTLINED,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  accentHue: MOCK_ACCENT_HUE,
  logoHue: undefined,
};

describe(buildAccentPreviewTokens, () => {
  it.each([
    { mode: 'light', isDark: false, ramp: ACCENT_RAMP_LIGHT },
    { mode: 'dark', isDark: true, ramp: ACCENT_RAMP_DARK },
  ])('formats the $mode accent ramp at the hue', ({ isDark, ramp }) => {
    expect(buildAccentPreviewTokens(MOCK_ACCENT_HUE, isDark)).toEqual(
      formatOklchRamp(ramp, MOCK_ACCENT_HUE),
    );
  });
});

describe(buildLogoPreviewTokens, () => {
  it.each([
    { mode: 'light', isDark: false, ramp: LOGO_RAMP_LIGHT },
    { mode: 'dark', isDark: true, ramp: LOGO_RAMP_DARK },
  ])('formats the $mode logo ramp at the hue', ({ isDark, ramp }) => {
    expect(buildLogoPreviewTokens(MOCK_LOGO_HUE, isDark)).toEqual(
      formatOklchRamp(ramp, MOCK_LOGO_HUE),
    );
  });
});

describe(accentHueGradient, () => {
  it('samples the light-mode accent across the full hue range', () => {
    const gradient = accentHueGradient();
    const { '--brand-primary': firstStop } = buildAccentPreviewTokens(
      HUE_MIN,
      false,
    );
    const { '--brand-primary': lastStop } = buildAccentPreviewTokens(
      HUE_MAX,
      false,
    );

    expect(gradient).toContain(firstStop);
    expect(gradient).toContain(lastStop);
  });
});

describe(buildThemePreviewStyle, () => {
  it.each(Object.values(HEADER_CONTROL_STYLE))(
    'carries the %s header control tokens onto the preview',
    (headerControlStyle) => {
      const style = buildThemePreviewStyle(
        { ...MOCK_PREVIEW_VALUES, headerControlStyle },
        false,
      );

      expect(style).toMatchObject(
        HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
      );
    },
  );

  it('colours the logo ramp from the accent hue when no logo hue is set', () => {
    const style = buildThemePreviewStyle(MOCK_PREVIEW_VALUES, false);

    expect(style).toMatchObject(buildLogoPreviewTokens(MOCK_ACCENT_HUE, false));
  });

  it('switches every ramp to its dark values in dark mode', () => {
    const style = buildThemePreviewStyle(
      { ...MOCK_PREVIEW_VALUES, logoHue: MOCK_LOGO_HUE },
      true,
    );

    expect(style).toMatchObject({
      ...buildAccentPreviewTokens(MOCK_ACCENT_HUE, true),
      ...buildLogoPreviewTokens(MOCK_LOGO_HUE, true),
    });
  });
});

describe(buildSitePreviewTheme, () => {
  it('resolves both fonts and the dark ramp for the chosen mode', () => {
    const values = defaultLookFormValues();

    expect(buildSitePreviewTheme(values, true)).toEqual({
      tokenStyle: buildThemePreviewStyle(values, true),
      isDark: true,
      headingFontFamily: FONT_OPTIONS[values.headingFont].fontFamily,
      bodyFontFamily: FONT_OPTIONS[values.bodyFont].fontFamily,
    });
  });
});
