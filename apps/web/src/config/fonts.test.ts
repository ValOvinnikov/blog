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
    return {
      className: `mock-${fontName}-className`,
      variable: `${fontName}${variable}`,
    };
  },
}));

const FONT_FILE = {
  [FONT_CHOICE.SPACE_GROTESK]: 'space-grotesk',
  [FONT_CHOICE.NEWSREADER]: 'newsreader',
  [FONT_CHOICE.JETBRAINS_MONO]: 'jetbrains-mono',
  [FONT_CHOICE.FRAUNCES]: 'fraunces',
  [FONT_CHOICE.INTER]: 'inter',
};

describe('resolveFontVariableClassName', () => {
  it.each(Object.values(FONT_CHOICE))(
    'sets the heading font to %s with every body font',
    (headingFont) => {
      Object.values(FONT_CHOICE).forEach((bodyFont) => {
        expect(
          resolveFontVariableClassName(headingFont, bodyFont).split(' '),
        ).toEqual([
          `${FONT_FILE[headingFont]}--font-display-family`,
          `${FONT_FILE[bodyFont]}--font-body-family`,
          'jetbrains-mono--font-mono-family',
        ]);
      });
    },
  );
});
