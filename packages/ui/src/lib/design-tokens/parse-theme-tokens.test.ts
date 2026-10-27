import { parseThemeTokens } from './parse-theme-tokens';

const MOCK_STYLESHEET = `
@theme inline {
  --color-bg: var(--bg); /* @role page background */
  --color-accent-solid: var(--accent-solid);
  --container-content: 72rem;
  --spacing-gutter: clamp(1rem, 5vw, 2.5rem);
  --radius-sm: 3px;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --text-xl: clamp(1.35rem, 1.15rem + 0.7vw, 1.6rem);
  --text-xl--line-height: 1.35;
  --text-display--letter-spacing: -0.02em;
  --ease-smooth: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 120ms;
}

/* not a token line */
.some-class {
  color: red;
}

h1,
h2 {
  font-family: var(--font-display-family);
}
`;

const CSS_VAR_COLOR_BG = '--color-bg';
const CSS_VAR_ACCENT_SOLID = '--color-accent-solid';
const CSS_VAR_RADIUS_SM = '--radius-sm';

describe(parseThemeTokens, () => {
  describe('with the sample stylesheet', () => {
    let tokens: ReturnType<typeof parseThemeTokens>;
    let findToken: (cssVar: string) => (typeof tokens)[number] | undefined;

    beforeEach(() => {
      tokens = parseThemeTokens(MOCK_STYLESHEET);
      findToken = (cssVar) => tokens.find((token) => token.cssVar === cssVar);
    });

    it('strips the matched prefix from the name and keeps the full cssVar', () => {
      const accentSolid = findToken(CSS_VAR_ACCENT_SOLID);

      expect(accentSolid?.name).toBe('accent-solid');
    });

    it.each([
      [CSS_VAR_COLOR_BG, 'var(--bg)'],
      [CSS_VAR_RADIUS_SM, '3px'],
    ])('captures the declared value of %s', (cssVar, value) => {
      const token = findToken(cssVar);

      expect(token?.value).toBe(value);
    });

    it('reads an @role comment when present', () => {
      const bg = findToken(CSS_VAR_COLOR_BG);

      expect(bg?.role).toBe('page background');
    });

    it('leaves role undefined when no @role comment is present', () => {
      const accentSolid = findToken(CSS_VAR_ACCENT_SOLID);

      expect(accentSolid?.role).toBeUndefined();
    });

    it.each([
      [CSS_VAR_COLOR_BG, 'color'],
      ['--font-mono', 'font'],
      [CSS_VAR_RADIUS_SM, 'radius'],
      ['--spacing-gutter', 'spacing'],
      ['--container-content', 'layout'],
      ['--text-xl', 'typography'],
      ['--ease-smooth', 'motion'],
      ['--duration-fast', 'motion'],
    ] as const)('maps %s to category %s', (cssVar, category) => {
      const token = findToken(cssVar);

      expect(token?.category).toBe(category);
    });

    it.each(['--text-xl--line-height', '--text-display--letter-spacing'])(
      'skips the %s companion line',
      (cssVar) => {
        const companion = findToken(cssVar);

        expect(companion).toBeUndefined();
      },
    );

    it('ignores non-token lines such as plain CSS rules', () => {
      const cssVars = tokens.map((token) => token.cssVar);
      const nonTokenVars = cssVars.filter((cssVar) => !cssVar.startsWith('--'));

      expect(nonTokenVars).toHaveLength(0);
    });
  });

  it.each(['--text', '--muted'])(
    'does not read %s from the raw :root palette',
    (cssVar) => {
      const tokens = parseThemeTokens(
        `${MOCK_STYLESHEET}\n:root { ${cssVar}: oklch(0.2 0 0); }`,
      );

      const token = tokens.find((candidate) => candidate.cssVar === cssVar);

      expect(token).toBeUndefined();
    },
  );

  it('does not duplicate a token seen more than once', () => {
    const tokens = parseThemeTokens(
      `${MOCK_STYLESHEET}\n${CSS_VAR_COLOR_BG}: var(--bg);`,
    );

    const colorBgTokens = tokens.filter(
      (token) => token.cssVar === CSS_VAR_COLOR_BG,
    );

    expect(colorBgTokens).toHaveLength(1);
  });
});
