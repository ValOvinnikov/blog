import type { CSSProperties } from 'react';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Prism token → CSS custom property map, defined for both `:root` and
 * `.dark` in `apps/web/index.css`. Kept web-local (not `@blog/tailwind-config`)
 * since `react-syntax-highlighter` is a web-only dependency (#862).
 */
const CODE_FG = 'var(--code-fg)';
const CODE_COMMENT = 'var(--code-comment)';
const CODE_KEYWORD = 'var(--code-keyword)';
const CODE_PROPERTY = 'var(--code-property)';
const CODE_STRING = 'var(--code-string)';
const CODE_VARIABLE = 'var(--code-variable)';
const CODE_CONSTANT = 'var(--code-constant)';
const CODE_URL = 'var(--code-url)';

/**
 * `oneDark` with its literal HSL colors replaced by theme-aware CSS custom
 * properties, and its hard-coded background stripped so the wrapping
 * `<figure>`'s `bg-surface-2` (`code-block-variants.ts`) shows through —
 * see #862. Every non-color declaration (spacing, layout, pseudo-selectors
 * for diff/previewer plugins we don't use) is kept as-is from `oneDark`;
 * only the base surface + core token colors are remapped.
 */
export const codeBlockSyntaxTheme: Record<string, CSSProperties> = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    textShadow: 'none',
    color: CODE_FG,
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    textShadow: 'none',
    color: CODE_FG,
    // The wrapping `<figure>` (`code-block-variants.ts`) already owns
    // spacing and top-corner rounding for the whole card, incl. the
    // `<figcaption>` filename bar rendered above this `<pre>` — zero
    // `oneDark`'s own margin/top-radius so they don't fight the figure's,
    // which would otherwise show as a gap/seam under the filename bar (#862).
    // Bottom corners are deliberately left alone (still `oneDark`'s
    // `borderRadius: '0.3em'` shorthand) — the filename-bar seam was only
    // ever a top-corner problem, this `<pre>`'s background is transparent,
    // and the figure's own `overflow-hidden rounded-lg` already governs the
    // visible outer shape, so any bottom-corner value here is inert.
    margin: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  comment: { color: CODE_COMMENT, fontStyle: 'italic' },
  prolog: { color: CODE_COMMENT },
  cdata: { color: CODE_COMMENT },
  doctype: { color: CODE_FG },
  punctuation: { color: CODE_FG },
  entity: { color: CODE_FG, cursor: 'help' },
  'attr-name': { color: CODE_CONSTANT },
  'class-name': { color: CODE_CONSTANT },
  boolean: { color: CODE_CONSTANT },
  constant: { color: CODE_CONSTANT },
  number: { color: CODE_CONSTANT },
  atrule: { color: CODE_CONSTANT },
  keyword: { color: CODE_KEYWORD },
  property: { color: CODE_PROPERTY },
  tag: { color: CODE_PROPERTY },
  symbol: { color: CODE_PROPERTY },
  deleted: { color: CODE_PROPERTY },
  important: { color: CODE_PROPERTY },
  selector: { color: CODE_STRING },
  string: { color: CODE_STRING },
  char: { color: CODE_STRING },
  builtin: { color: CODE_STRING },
  inserted: { color: CODE_STRING },
  regex: { color: CODE_STRING },
  'attr-value': { color: CODE_STRING },
  variable: { color: CODE_VARIABLE },
  operator: { color: CODE_VARIABLE },
  function: { color: CODE_VARIABLE },
  url: { color: CODE_URL },
};
