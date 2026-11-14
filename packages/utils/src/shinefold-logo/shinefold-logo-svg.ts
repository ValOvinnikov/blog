import {
  SHINEFOLD_LOGO,
  SHINEFOLD_LOGO_NAME,
  type IShinefoldLogoShape,
  type TShinefoldLogoVariant,
} from './shinefold-logo';

export interface IShinefoldLogoSvgOptions {
  width?: number;
  height?: number;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const shapeMarkup = ({ d, fill, fillRule }: IShinefoldLogoShape): string =>
  `<path fill="${fill}"${fillRule ? ` fill-rule="${fillRule}"` : ''} d="${d}"/>`;

export function shinefoldLogoSvg(
  variant: TShinefoldLogoVariant,
  { width, height }: IShinefoldLogoSvgOptions = {},
): string {
  const { viewBox, shapes } = SHINEFOLD_LOGO[variant];
  const size = [
    width === undefined ? '' : ` width="${width}"`,
    height === undefined ? '' : ` height="${height}"`,
  ].join('');

  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="${viewBox}"${size} role="img" aria-label="${SHINEFOLD_LOGO_NAME}">${shapes.map(shapeMarkup).join('')}</svg>`;
}
