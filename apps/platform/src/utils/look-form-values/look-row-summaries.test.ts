import {
  ACCOUNT_BUTTON_STYLE,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_FAVICON_URL,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import { buildLookRowSummaries } from './look-row-summaries';

const t = makeEnTranslator('lookForm');

const SEED_ACCENT_HUE = 192;
const OWN_LOGO_HUE = 40;
const MULTIPLE_LANGUAGES = { hasMultipleLanguages: true };

const seedValues = () => ({
  ...defaultLookFormValues(),
  accentHue: SEED_ACCENT_HUE,
  logoHue: undefined,
  logo: { url: MOCK_LOGO_URL },
  favicon: { url: undefined },
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  buttonShape: BUTTON_SHAPE.ROUNDED,
  busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
  spinnerStyle: SPINNER_STYLE.BRAILLE,
  headerLayout: HEADER_LAYOUT.CLASSIC,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
  footerLayout: FOOTER_LAYOUT.COLUMNS,
  footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
  footerSurface: FOOTER_SURFACE.FULL_WIDTH,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
});

describe(buildLookRowSummaries, () => {
  it('summarises every row of the seeded look in its drawn order', () => {
    expect(buildLookRowSummaries(seedValues(), t, MULTIPLE_LANGUAGES)).toEqual({
      [LOOK_ROW.COLOUR]: 'Hue 192 · logo follows accent',
      [LOOK_ROW.BRAND]: 'Logo uploaded · No favicon',
      [LOOK_ROW.TYPE]: 'Fraunces · Inter',
      [LOOK_ROW.SHAPE]: 'Medium · Default',
      [LOOK_ROW.CARDS]: 'Accent bar',
      [LOOK_ROW.BUTTONS]: 'Rounded · Busy label · Braille',
      [LOOK_ROW.HEADER]:
        'Classic · Full width · Dropdown · Outlined · Pill with label',
      [LOOK_ROW.FOOTER]:
        'Columns · Brand tint · Full width · Cookie link and button',
      [LOOK_ROW.LANGUAGE_SWITCHER]: 'Globe',
    });
  });

  it("names a logo's own hue", () => {
    const values = { ...seedValues(), logoHue: OWN_LOGO_HUE };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.COLOUR]).toBe('Hue 192 · Logo hue 40');
  });

  it('reads a missing logo and an uploaded favicon', () => {
    const values = {
      ...seedValues(),
      logo: { url: undefined },
      favicon: { url: MOCK_FAVICON_URL },
    };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.BRAND]).toBe('No logo · Favicon uploaded');
  });

  it('still names the spinner while busy buttons draw a progress edge', () => {
    const values = {
      ...seedValues(),
      busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
    };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.BUTTONS]).toBe(
      'Rounded · Progress edge · Braille',
    );
  });

  it.each([
    [BUTTON_SHAPE.SQUARE, 'Square'],
    [BUTTON_SHAPE.PILL, 'Pill'],
  ])('leads the Buttons row with the %s shape', (buttonShape, reads) => {
    const values = { ...seedValues(), buttonShape };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.BUTTONS]).toBe(`${reads} · Busy label · Braille`);
  });

  it.each([
    [COOKIE_SETTINGS_BUTTON.HIDDEN, 'Cookie link in footer'],
    [COOKIE_SETTINGS_BUTTON.ONLY, 'Floating cookie button'],
  ])('reads the %s cookie settings choice', (cookieSettingsButton, reads) => {
    const values = { ...seedValues(), cookieSettingsButton };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.FOOTER]).toBe(
      `Columns · Brand tint · Full width · ${reads}`,
    );
  });

  it('adds One language to the language switcher on a one-language site', () => {
    const summaries = buildLookRowSummaries(seedValues(), t, {
      hasMultipleLanguages: false,
    });

    expect(summaries[LOOK_ROW.LANGUAGE_SWITCHER]).toBe('Globe · One language');
  });
});
