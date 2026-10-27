import { FONT_CHOICE } from '@blog/config';

import { resolveFontVariableClassName } from './fonts';

vi.mock('next/font/local', () => ({
  default: ({
    src,
    variable,
  }: {
    src: [{ path: string }, ...{ path: string }[]];
    variable: string;
  }) => {
    const fontName = src[0].path.replace(/^.*\//, '').replace('.woff2', '');
    return { variable: `${fontName}${variable}` };
  },
}));

const FONT_FILE = {
  [FONT_CHOICE.SPACE_GROTESK]: 'space-grotesk',
  [FONT_CHOICE.NEWSREADER]: 'newsreader',
  [FONT_CHOICE.JETBRAINS_MONO]: 'jetbrains-mono',
  [FONT_CHOICE.FRAUNCES]: 'fraunces',
  [FONT_CHOICE.INTER]: 'inter',
};

const FONT_PAIRS = Object.values(FONT_CHOICE).flatMap((headingFont) =>
  Object.values(FONT_CHOICE).map((bodyFont) => ({ headingFont, bodyFont })),
);

describe(resolveFontVariableClassName, () => {
  it.each(FONT_PAIRS)(
    'pairs the $headingFont heading with the $bodyFont body and the mono font',
    ({ headingFont, bodyFont }) => {
      const className = resolveFontVariableClassName(headingFont, bodyFont);

      expect(className).toBe(
        [
          `${FONT_FILE[headingFont]}--font-display-family`,
          `${FONT_FILE[bodyFont]}--font-body-family`,
          'jetbrains-mono--font-mono-family',
        ].join(' '),
      );
    },
  );
});
