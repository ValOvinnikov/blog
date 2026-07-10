export type TCategory =
  'color' | 'typography' | 'font' | 'radius' | 'spacing' | 'layout' | 'motion';

export type TToken = {
  name: string;
  cssVar: string;
  category: TCategory;
  role?: string;
};

const PREFIX_CATEGORY: ReadonlyArray<readonly [string, TCategory]> = [
  ['color', 'color'],
  ['container', 'layout'],
  ['spacing', 'spacing'],
  ['radius', 'radius'],
  ['font', 'font'],
  ['text', 'typography'],
  ['ease', 'motion'],
  ['duration', 'motion'],
];

const LINE =
  /^\s*(--[a-z0-9-]+)\s*:\s*[^;]+;(?:\s*\/\*\s*@role\s+(.+?)\s*\*\/)?/;

/**
 * Parses `@blog/tailwind-config`'s `theme.css` into a flat list of design
 * tokens, auto-discovering every `--<prefix>-<name>` custom property so the
 * design-token gallery never needs manual edits when a token is renamed,
 * added, or removed.
 */
export const parseThemeTokens = (css: string): TToken[] => {
  const seen = new Set<string>();
  const tokens: TToken[] = [];

  for (const line of css.split('\n')) {
    const m = LINE.exec(line);
    if (!m) continue;

    const cssVar = m[1]!;
    if (/--(line-height|letter-spacing)$/.test(cssVar)) continue;
    if (seen.has(cssVar)) continue;

    const bare = cssVar.slice(2);
    const hit = PREFIX_CATEGORY.find(
      ([prefix]) => bare === prefix || bare.startsWith(`${prefix}-`),
    );
    if (!hit) continue;

    const [prefix, category] = hit;
    const name = bare === prefix ? prefix : bare.slice(prefix.length + 1);

    seen.add(cssVar);
    tokens.push({ name, cssVar, category, role: m[2]?.trim() });
  }

  return tokens;
};
