export type TCategory =
  'color' | 'typography' | 'font' | 'radius' | 'spacing' | 'layout' | 'motion';

export type TToken = {
  name: string;
  cssVar: string;
  category: TCategory;
  /**
   * The token's declared value from theme.css, used directly for rendering.
   * Colours resolve to a raw-palette `var(--…)` (never tree-shaken); other
   * categories are literals (`12px`, `clamp(…)`). Using the value avoids
   * Tailwind tree-shaking unused `@theme` variables out of the runtime CSS.
   */
  value: string;
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

// A custom-property declaration with an optional trailing `@role` comment.
// The value may span multiple lines (e.g. a `var(--x, …)` font fallback), so
// it matches everything up to the terminating `;`.
const DECL =
  /(--[a-z0-9-]+)\s*:\s*([^;{}]+?)\s*;(?:[ \t]*\/\*\s*@role\s+([^*]+?)\s*\*\/)?/g;

// The `@theme { … }` and `@theme inline { … }` block bodies only — never the
// `:root` / `.dark` raw palette (whose bare `--text` / `--muted` names would be
// miscategorised as typography).
const themeBlocks = (css: string): string =>
  [...css.matchAll(/@theme(?:\s+inline)?\s*\{([^}]*)\}/g)]
    .map((m) => m[1])
    .join('\n');

const parseDeclarations = (block: string, seen: Set<string>): TToken[] => {
  const tokens: TToken[] = [];

  for (const m of block.matchAll(DECL)) {
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
    const value = m[2]!.replace(/\s+/g, ' ').trim();

    seen.add(cssVar);
    tokens.push({ name, cssVar, category, value, role: m[3]?.trim() });
  }

  return tokens;
};

/**
 * Parses `@blog/tailwind-config`'s `theme.css` into a flat list of design
 * tokens, auto-discovering every `--<prefix>-<name>` custom property (and its
 * value) so the gallery never needs manual edits when a token is renamed,
 * added, or removed.
 */
export const parseThemeTokens = (css: string): TToken[] => {
  const seen = new Set<string>();
  const themeTokens = parseDeclarations(themeBlocks(css), seen);

  // Durations live in `:root` (so the @layer base transition utilities keep
  // their `var()` references), so pull just the motion tokens from there —
  // filtering out the raw colour palette that would otherwise leak in.
  const root = /:root\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  const rootMotion = parseDeclarations(root, seen).filter(
    (token) => token.category === 'motion',
  );

  return [...themeTokens, ...rootMotion];
};
