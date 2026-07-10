import { parseThemeTokens } from './parse-theme-tokens';

const SAMPLE = `
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
  --ease-console: cubic-bezier(0.2, 0, 0, 1);
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

describe(parseThemeTokens, () => {
  it('strips the matched prefix from the token name while keeping the full cssVar', () => {
    const tokens = parseThemeTokens(SAMPLE);
    const accentSolid = tokens.find((t) => t.cssVar === '--color-accent-solid');
    expect(accentSolid).toBeDefined();
    expect(accentSolid?.name).toBe('accent-solid');
  });

  it('reads an @role comment when present', () => {
    const tokens = parseThemeTokens(SAMPLE);
    const bg = tokens.find((t) => t.cssVar === '--color-bg');
    expect(bg?.role).toBe('page background');
  });

  it('leaves role undefined when no @role comment is present', () => {
    const tokens = parseThemeTokens(SAMPLE);
    const accentSolid = tokens.find((t) => t.cssVar === '--color-accent-solid');
    expect(accentSolid?.role).toBeUndefined();
  });

  it.each([
    ['--color-bg', 'color'],
    ['--font-mono', 'font'],
    ['--radius-sm', 'radius'],
    ['--spacing-gutter', 'spacing'],
    ['--container-content', 'layout'],
    ['--text-xl', 'typography'],
    ['--ease-console', 'motion'],
    ['--duration-fast', 'motion'],
  ] as const)('maps %s to category %s', (cssVar, category) => {
    const tokens = parseThemeTokens(SAMPLE);
    const token = tokens.find((t) => t.cssVar === cssVar);
    expect(token?.category).toBe(category);
  });

  it('skips --*--line-height companion lines', () => {
    const tokens = parseThemeTokens(SAMPLE);
    expect(
      tokens.find((t) => t.cssVar === '--text-xl--line-height'),
    ).toBeUndefined();
  });

  it('skips --*--letter-spacing companion lines', () => {
    const tokens = parseThemeTokens(SAMPLE);
    expect(
      tokens.find((t) => t.cssVar === '--text-display--letter-spacing'),
    ).toBeUndefined();
  });

  it('ignores non-token lines such as plain CSS rules', () => {
    const tokens = parseThemeTokens(SAMPLE);
    expect(tokens.some((t) => t.name === 'family')).toBe(false);
    expect(tokens).not.toContainEqual(
      expect.objectContaining({
        cssVar: expect.stringContaining('color: red'),
      }),
    );
  });

  it('does not duplicate a token seen more than once', () => {
    const tokens = parseThemeTokens(`${SAMPLE}\n--color-bg: var(--bg);`);
    expect(tokens.filter((t) => t.cssVar === '--color-bg')).toHaveLength(1);
  });
});
