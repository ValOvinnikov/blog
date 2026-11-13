import {
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  oklchStopToHex,
  type TMaybeUndefined,
  type TOklchStop,
} from '@blog/config';

type TTileStops = { light: TOklchStop; dark: TOklchStop };

type TTileSvgInput = {
  hue: number;
  tile: TTileStops;
  letter?: TTileStops & { initial: string };
};

const NEUTRAL_HUE = 0;

const fillRule = (selector: string, stop: TOklchStop, hue: number): string =>
  `.${selector}{fill:${oklchStopToHex(stop, hue)}}`;

const buildTileSvg = ({ hue, tile, letter }: TTileSvgInput): string => {
  const lightRules = [
    fillRule('tile', tile.light, hue),
    letter ? fillRule('letter', letter.light, hue) : '',
  ].join('');
  const darkRules = [
    fillRule('tile', tile.dark, hue),
    letter ? fillRule('letter', letter.dark, hue) : '',
  ].join('');
  const letterText = letter
    ? `<text class="letter" x="40" y="40" dy="0.35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="44" font-weight="700">${letter.initial}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><style>${lightRules}@media (prefers-color-scheme:dark){${darkRules}}</style><rect class="tile" width="80" height="80" rx="20"/>${letterText}</svg>`;
};

export const buildInitialTileSvg = (
  initial: TMaybeUndefined<string>,
  logoHue: number,
): string =>
  buildTileSvg({
    hue: logoHue,
    tile: {
      light: LOGO_RAMP_LIGHT['--logo-tile'],
      dark: LOGO_RAMP_DARK['--logo-tile'],
    },
    letter: initial
      ? {
          initial,
          light: LOGO_RAMP_LIGHT['--logo-tile-contrast'],
          dark: LOGO_RAMP_DARK['--logo-tile-contrast'],
        }
      : undefined,
  });

export const buildNeutralTileSvg = (): string =>
  buildTileSvg({
    hue: NEUTRAL_HUE,
    tile: {
      light: NEUTRAL_RAMP_LIGHT['--border-strong'],
      dark: NEUTRAL_RAMP_DARK['--border-strong'],
    },
  });
