import { LOOK_ROW } from '@platform/constants/look-row';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_FAVICON_URL,
  MOCK_LOGO_DARK_URL,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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
  HEADER_ACTION_STYLE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  NAV_LINK_STYLE,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@shinefold/config';

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
  logoDark: { url: undefined },
  favicon: { url: undefined },
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  headerActionStyle: HEADER_ACTION_STYLE.FILLED,
  buttonShape: BUTTON_SHAPE.ROUNDED,
  busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
  spinnerStyle: SPINNER_STYLE.BRAILLE,
  headerLayout: HEADER_LAYOUT.CLASSIC,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  navLinkStyle: NAV_LINK_STYLE.PLAIN,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
  footerLayout: FOOTER_LAYOUT.COLUMNS,
  footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
  footerSurface: FOOTER_SURFACE.FULL_WIDTH,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
});

const HEADER_LEAD = 'Classic · Full width · Dropdown';
const HEADER_TAIL = 'Filled action · Pill with label';

describe(buildLookRowSummaries, () => {
  it('summarises every row of the seeded look in its drawn order', () => {
    expect(buildLookRowSummaries(seedValues(), t, MULTIPLE_LANGUAGES)).toEqual({
      [LOOK_ROW.BRAND]:
        'Logo uploaded · No dark-mode logo · logo follows accent · No favicon',
      [LOOK_ROW.COLOUR]: 'Hue 192 · Reader chooses',
      [LOOK_ROW.TYPE]: 'Fraunces · Inter',
      [LOOK_ROW.SHAPE]: 'Medium · Rounded · Comfortable · Accent bar',
      [LOOK_ROW.HEADER]: `${HEADER_LEAD} · Plain · Outlined · Globe · ${HEADER_TAIL}`,
      [LOOK_ROW.FOOTER]: 'Columns · Brand tint · Full width',
      [LOOK_ROW.DETAILS]: 'Braille · Busy label · Cookie link and button',
    });
  });

  it("names a logo's own hue", () => {
    const values = { ...seedValues(), logoHue: OWN_LOGO_HUE };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.BRAND]).toBe(
      'Logo uploaded · No dark-mode logo · Logo mark hue 40 · No favicon',
    );
  });

  it.each([
    {
      images: 'a missing logo and an uploaded favicon',
      overrides: {
        logo: { url: undefined },
        favicon: { url: MOCK_FAVICON_URL },
      },
      summary:
        'No logo · No dark-mode logo · logo follows accent · Favicon uploaded',
    },
    {
      images: 'an uploaded dark-mode logo',
      overrides: { logoDark: { url: MOCK_LOGO_DARK_URL } },
      summary:
        'Logo uploaded · Dark-mode logo uploaded · logo follows accent · No favicon',
    },
  ])('reads $images', ({ overrides, summary }) => {
    const values = { ...seedValues(), ...overrides };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.BRAND]).toBe(summary);
  });

  it('still names the spinner while busy buttons draw a progress edge', () => {
    const values = {
      ...seedValues(),
      busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
    };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.DETAILS]).toBe(
      'Braille · Progress edge · Cookie link and button',
    );
  });

  it.each([
    [BUTTON_SHAPE.SQUARE, 'Square'],
    [BUTTON_SHAPE.PILL, 'Pill'],
  ])('names the %s button shape after the corners', (buttonShape, reads) => {
    const values = { ...seedValues(), buttonShape };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.SHAPE]).toBe(
      `Medium · ${reads} · Comfortable · Accent bar`,
    );
  });

  it('puts the current-link highlight after the sub-menu style', () => {
    const values = { ...seedValues(), navLinkStyle: NAV_LINK_STYLE.UNDERLINE };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.HEADER]).toBe(
      `${HEADER_LEAD} · Underline · Outlined · Globe · ${HEADER_TAIL}`,
    );
  });

  it.each([
    [HEADER_ACTION_STYLE.OUTLINED, 'Outlined action'],
    [HEADER_ACTION_STYLE.PLAIN, 'Action as link'],
  ])('reads the %s header action style', (headerActionStyle, reads) => {
    const values = { ...seedValues(), headerActionStyle };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.HEADER]).toBe(
      `${HEADER_LEAD} · Plain · Outlined · Globe · ${reads} · Pill with label`,
    );
  });

  it.each([
    [COOKIE_SETTINGS_BUTTON.HIDDEN, 'Cookie link in footer'],
    [COOKIE_SETTINGS_BUTTON.ONLY, 'Floating cookie button'],
  ])('reads the %s cookie settings choice', (cookieSettingsButton, reads) => {
    const values = { ...seedValues(), cookieSettingsButton };

    const summaries = buildLookRowSummaries(values, t, MULTIPLE_LANGUAGES);

    expect(summaries[LOOK_ROW.DETAILS]).toBe(`Braille · Busy label · ${reads}`);
  });

  it('leaves the language switcher out of the header on a one-language site', () => {
    const summaries = buildLookRowSummaries(seedValues(), t, {
      hasMultipleLanguages: false,
    });

    expect(summaries[LOOK_ROW.HEADER]).toBe(
      `${HEADER_LEAD} · Plain · Outlined · ${HEADER_TAIL}`,
    );
  });
});
