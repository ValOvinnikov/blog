import { SHINEFOLD_LOGO_PATH as PATH } from './paths';

export const SHINEFOLD_LOGO_NAME = 'Shinefold';

export const SHINEFOLD_LOGO_COLOR = {
  YELLOW: '#ffc233',
  BLOCK: '#0e1726',
  INK: '#12141a',
  PAPER: '#e8eaef',
} as const;

export const SHINEFOLD_LOGO_VARIANT = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  MONO: 'MONO',
  MARK: 'MARK',
  MARK_MONO: 'MARK_MONO',
} as const;

export type TShinefoldLogoVariant =
  (typeof SHINEFOLD_LOGO_VARIANT)[keyof typeof SHINEFOLD_LOGO_VARIANT];

export const SHINEFOLD_LOGO_CURRENT_COLOR = 'currentColor';

export interface IShinefoldLogoShape {
  d: string;
  fill: string;
  fillRule?: 'evenodd';
}

export interface IShinefoldLogo {
  viewBox: string;
  shapes: readonly IShinefoldLogoShape[];
}

const { YELLOW, BLOCK, INK, PAPER } = SHINEFOLD_LOGO_COLOR;
const MONO = SHINEFOLD_LOGO_CURRENT_COLOR;
const FULL_VIEW_BOX = '0 0 592.7 125';
const MARK_VIEW_BOX = '0 0 125 125';

const monoMarkShape: IShinefoldLogoShape = {
  d: `${PATH.TILE}${PATH.BLOCK}${PATH.S}`,
  fill: MONO,
  fillRule: 'evenodd',
};

const colorMarkShapes: readonly IShinefoldLogoShape[] = [
  { d: PATH.TILE, fill: YELLOW },
  { d: PATH.BLOCK, fill: BLOCK },
  { d: PATH.S, fill: YELLOW },
];

const coloredLogoShapes = (ink: string): readonly IShinefoldLogoShape[] => [
  ...colorMarkShapes,
  { d: PATH.LETTERING, fill: ink },
  { d: PATH.UNLIT_HALF, fill: ink },
  { d: PATH.LIT_HALF, fill: YELLOW },
];

export const SHINEFOLD_LOGO: Record<TShinefoldLogoVariant, IShinefoldLogo> = {
  LIGHT: { viewBox: FULL_VIEW_BOX, shapes: coloredLogoShapes(INK) },
  DARK: { viewBox: FULL_VIEW_BOX, shapes: coloredLogoShapes(PAPER) },
  MONO: {
    viewBox: FULL_VIEW_BOX,
    shapes: [
      monoMarkShape,
      { d: PATH.LETTERING, fill: MONO },
      { d: PATH.RING, fill: MONO, fillRule: 'evenodd' },
      { d: PATH.LIT_HALF, fill: MONO },
    ],
  },
  MARK: { viewBox: MARK_VIEW_BOX, shapes: colorMarkShapes },
  MARK_MONO: { viewBox: MARK_VIEW_BOX, shapes: [monoMarkShape] },
};
