import {
  CARD_STYLE,
  COLOR_SCHEME,
  HEADER_CONTROL_STYLE,
  NAV_LINK_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config/constants';

import { findContrastFailures } from './contrast-check';
import { KNOWN_CONTRAST_FAILURES } from './contrast-known-failures';
import { measureContrast } from './contrast-tokens';

const MOCK_LIGHT_ACCENT_BAR = {
  scheme: COLOR_SCHEME.LIGHT,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  navLinkStyle: NAV_LINK_STYLE.PLAIN,
  hue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
};

const MOCK_TRANSPARENT_FILLS = {
  ...MOCK_LIGHT_ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
};

const BRAND_PRIMARY_TOKEN = '--brand-primary';
const TEXT_TOKEN = '--text';
const HEADER_CONTROL_FILL_TOKEN = '--header-control-fill' as const;
const SECONDARY_TOKEN = '--secondary';
const NAV_LINK_FILL_TOKEN = '--nav-link-fill' as const;

describe(findContrastFailures, () => {
  it('finds exactly the known failures across every hue, scheme and card style', () => {
    expect(findContrastFailures()).toEqual(KNOWN_CONTRAST_FAILURES);
  });
});

describe(measureContrast, () => {
  it('measures an alias as the token it points at', () => {
    expect(measureContrast('--ring', '--primary', MOCK_LIGHT_ACCENT_BAR)).toBe(
      measureContrast(BRAND_PRIMARY_TOKEN, '--primary', MOCK_LIGHT_ACCENT_BAR),
    );
  });

  it('resolves the item accent colour from the card style', () => {
    expect(
      measureContrast('--item-accent-color', '--surface', {
        ...MOCK_LIGHT_ACCENT_BAR,
        cardStyle: CARD_STYLE.OUTLINED,
      }),
    ).toBe(measureContrast('--border', '--surface', MOCK_LIGHT_ACCENT_BAR));
  });

  it('resolves the header control fill from the header control style', () => {
    expect(
      measureContrast(TEXT_TOKEN, HEADER_CONTROL_FILL_TOKEN, {
        ...MOCK_LIGHT_ACCENT_BAR,
        headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
      }),
    ).toBe(measureContrast(TEXT_TOKEN, '--border', MOCK_LIGHT_ACCENT_BAR));
  });

  it.each([
    ['header control', HEADER_CONTROL_FILL_TOKEN],
    ['navigation link', NAV_LINK_FILL_TOKEN],
  ])('measures a transparent %s against the page background', (_, fill) => {
    expect(measureContrast(TEXT_TOKEN, fill, MOCK_TRANSPARENT_FILLS)).toBe(
      measureContrast(TEXT_TOKEN, '--primary', MOCK_LIGHT_ACCENT_BAR),
    );
  });

  it('resolves the navigation link fill from the navigation link style', () => {
    expect(
      measureContrast(BRAND_PRIMARY_TOKEN, NAV_LINK_FILL_TOKEN, {
        ...MOCK_LIGHT_ACCENT_BAR,
        navLinkStyle: NAV_LINK_STYLE.SOFT,
      }),
    ).toBe(
      measureContrast(
        BRAND_PRIMARY_TOKEN,
        '--brand-primary-muted',
        MOCK_LIGHT_ACCENT_BAR,
      ),
    );
  });

  it('measures the accent ramp at the hue it is given', () => {
    expect(
      measureContrast(BRAND_PRIMARY_TOKEN, SECONDARY_TOKEN, {
        ...MOCK_LIGHT_ACCENT_BAR,
        hue: 190,
      }),
    ).toBeLessThan(
      measureContrast(
        BRAND_PRIMARY_TOKEN,
        SECONDARY_TOKEN,
        MOCK_LIGHT_ACCENT_BAR,
      ),
    );
  });

  it('measures copy over a translucent scrim as composited over a white photo', () => {
    expect(
      measureContrast(
        '--on-image',
        '--scrim-neutral-weak',
        MOCK_LIGHT_ACCENT_BAR,
      ),
    ).toBeCloseTo(2.24, 2);
  });

  it('throws for a token with no registered value', () => {
    expect(() =>
      measureContrast('--unregistered', '--primary', MOCK_LIGHT_ACCENT_BAR),
    ).toThrow('No LIGHT value registered for --unregistered');
  });
});
