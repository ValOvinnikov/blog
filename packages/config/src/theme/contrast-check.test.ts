import {
  CARD_STYLE,
  COLOR_SCHEME,
  CONTRAST_ROLE,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  HUE_MIN,
  NAV_LINK_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@shinefold/config/constants';

import { findContrastFailures, findPairFailures } from './contrast-check';
import { KNOWN_CONTRAST_FAILURES } from './contrast-known-failures';
import {
  BORDER,
  BRAND_PRIMARY,
  BRAND_PRIMARY_MUTED,
  ITEM_ACCENT_BRAND_SHARE,
  PRIMARY,
  SECONDARY,
  SURFACE,
  TEXT,
} from './contrast-surfaces';
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

const HEADER_CONTROL_FILL_TOKEN = '--header-control-fill' as const;
const NAV_LINK_FILL_TOKEN = '--nav-link-fill' as const;

describe(findContrastFailures, () => {
  it('finds exactly the known failures across every hue, scheme and card style', () => {
    expect(findContrastFailures()).toEqual(KNOWN_CONTRAST_FAILURES);
  });
});

describe(findPairFailures, () => {
  it('reports every hue for a hue-following pair whose colours stay fixed', () => {
    const failures = findPairFailures(
      {
        SAME_SURFACE: {
          foreground: SURFACE,
          surfaces: [SURFACE],
          role: CONTRAST_ROLE.TEXT,
          followsAccentHue: true,
        },
      },
      [{ scheme: COLOR_SCHEME.LIGHT }],
    );

    expect(failures).toEqual([
      expect.objectContaining({ hues: `${HUE_MIN}-${HUE_MAX - 1}` }),
    ]);
  });
});

describe(measureContrast, () => {
  it('measures an alias as the token it points at', () => {
    expect(measureContrast('--ring', PRIMARY, MOCK_LIGHT_ACCENT_BAR)).toBe(
      measureContrast(BRAND_PRIMARY, PRIMARY, MOCK_LIGHT_ACCENT_BAR),
    );
  });

  it('resolves the item accent colour from the card style', () => {
    expect(
      measureContrast(ITEM_ACCENT_BRAND_SHARE, SURFACE, {
        ...MOCK_LIGHT_ACCENT_BAR,
        cardStyle: CARD_STYLE.OUTLINED,
      }),
    ).toBe(measureContrast(BORDER, SURFACE, MOCK_LIGHT_ACCENT_BAR));
  });

  it('paints the accent edge in the brand colour under the accent bar', () => {
    expect(
      measureContrast(ITEM_ACCENT_BRAND_SHARE, SURFACE, MOCK_LIGHT_ACCENT_BAR),
    ).toBe(measureContrast(BRAND_PRIMARY, SURFACE, MOCK_LIGHT_ACCENT_BAR));
  });

  it('resolves the header control fill from the header control style', () => {
    expect(
      measureContrast(TEXT, HEADER_CONTROL_FILL_TOKEN, {
        ...MOCK_LIGHT_ACCENT_BAR,
        headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
      }),
    ).toBe(measureContrast(TEXT, BORDER, MOCK_LIGHT_ACCENT_BAR));
  });

  it.each([
    ['header control', HEADER_CONTROL_FILL_TOKEN],
    ['navigation link', NAV_LINK_FILL_TOKEN],
  ])('measures a transparent %s against the page background', (_, fill) => {
    expect(measureContrast(TEXT, fill, MOCK_TRANSPARENT_FILLS)).toBe(
      measureContrast(TEXT, PRIMARY, MOCK_LIGHT_ACCENT_BAR),
    );
  });

  it('resolves the navigation link fill from the navigation link style', () => {
    expect(
      measureContrast(BRAND_PRIMARY, NAV_LINK_FILL_TOKEN, {
        ...MOCK_LIGHT_ACCENT_BAR,
        navLinkStyle: NAV_LINK_STYLE.SOFT,
      }),
    ).toBe(
      measureContrast(
        BRAND_PRIMARY,
        BRAND_PRIMARY_MUTED,
        MOCK_LIGHT_ACCENT_BAR,
      ),
    );
  });

  it('measures the accent ramp at the hue it is given', () => {
    expect(
      measureContrast(BRAND_PRIMARY, SECONDARY, {
        ...MOCK_LIGHT_ACCENT_BAR,
        hue: 190,
      }),
    ).toBeLessThan(
      measureContrast(BRAND_PRIMARY, SECONDARY, MOCK_LIGHT_ACCENT_BAR),
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
      measureContrast('--unregistered', PRIMARY, MOCK_LIGHT_ACCENT_BAR),
    ).toThrow('No LIGHT value registered for --unregistered');
  });
});
