export type TCategory =
  | 'color'
  | 'typography'
  | 'font'
  | 'radius'
  | 'spacing'
  | 'layout'
  | 'motion'
  | 'hook';

export type TToken = {
  name: string;
  cssVar: string;
  category: TCategory;
  value: string;
  role?: string;
};

const PREFIX_CATEGORY: ReadonlyArray<readonly [string, TCategory]> = [
  ['color', 'color'],
  ['container', 'layout'],
  ['spacing', 'spacing'],
  ['radius', 'radius'],
  ['font-weight', 'hook'],
  ['heading', 'hook'],
  ['aspect', 'hook'],
  ['divider', 'hook'],
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
    const keepsFullName = category === 'hook' || bare === prefix;
    const name = keepsFullName ? bare : bare.slice(prefix.length + 1);
    const value = m[2]!.replace(/\s+/g, ' ').trim();

    seen.add(cssVar);
    tokens.push({ name, cssVar, category, value, role: m[3]?.trim() });
  }

  return tokens;
};

export const parseThemeTokens = (css: string): TToken[] => {
  const seen = new Set<string>();
  const themeTokens = parseDeclarations(themeBlocks(css), seen);

  const root = /:root\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  const rootMotion = parseDeclarations(root, seen).filter(
    (token) => token.category === 'motion',
  );

  return [...themeTokens, ...rootMotion];
};
