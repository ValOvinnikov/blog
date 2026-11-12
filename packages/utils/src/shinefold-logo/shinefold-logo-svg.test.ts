import {
  SHINEFOLD_LOGO,
  SHINEFOLD_LOGO_COLOR,
  SHINEFOLD_LOGO_CURRENT_COLOR,
  SHINEFOLD_LOGO_VARIANT,
} from './shinefold-logo';
import { shinefoldLogoSvg } from './shinefold-logo-svg';

const fillsOf = (svg: string) =>
  [...svg.matchAll(/fill="([^"]+)"/g)].map(([, fill]) => fill);

const evenoddCount = (svg: string) => svg.match(/evenodd/g)?.length ?? 0;

describe('shinefoldLogoSvg', () => {
  it.each(Object.values(SHINEFOLD_LOGO_VARIANT))(
    'renders %s as one svg with its view box and one path per shape',
    (variant) => {
      const svg = shinefoldLogoSvg(variant);

      expect(svg.match(/<svg /g)).toHaveLength(1);
      expect(svg).toContain(`viewBox="${SHINEFOLD_LOGO[variant].viewBox}"`);
      expect(svg.match(/<path /g)).toHaveLength(
        SHINEFOLD_LOGO[variant].shapes.length,
      );
    },
  );

  it('draws the light and dark logos alike except for the lettering ink', () => {
    const light = fillsOf(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.LIGHT));
    const dark = fillsOf(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.DARK));

    expect(light).toContain(SHINEFOLD_LOGO_COLOR.INK);
    expect(dark).toContain(SHINEFOLD_LOGO_COLOR.PAPER);
    expect(light).not.toContain(SHINEFOLD_LOGO_COLOR.PAPER);
    expect(dark).not.toContain(SHINEFOLD_LOGO_COLOR.INK);
  });

  it.each([SHINEFOLD_LOGO_VARIANT.MONO, SHINEFOLD_LOGO_VARIANT.MARK_MONO])(
    'draws %s only in the surrounding text colour',
    (variant) => {
      expect(new Set(fillsOf(shinefoldLogoSvg(variant)))).toEqual(
        new Set([SHINEFOLD_LOGO_CURRENT_COLOR]),
      );
    },
  );

  it('cuts the block and the o ring out of a one-colour logo with evenodd', () => {
    expect(evenoddCount(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MONO))).toBe(2);
    expect(
      evenoddCount(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK_MONO)),
    ).toBe(1);
  });

  it('adds width and height only when given', () => {
    const sized = shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK, {
      width: 24,
      height: 24,
    });

    expect(sized).toContain('width="24" height="24"');
    expect(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK)).not.toContain(
      'width=',
    );
  });
});
