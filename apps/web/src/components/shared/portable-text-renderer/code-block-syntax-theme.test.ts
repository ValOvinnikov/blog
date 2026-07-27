import { codeBlockSyntaxTheme } from './code-block-syntax-theme';

// #862 — this theme object is what makes the code block follow the site's
// active `.dark` class instead of always rendering `oneDark`'s fixed dark
// palette: the base surface entries must not carry a literal background, and
// every token color must be a CSS custom property (resolved per-theme by
// `:root`/`.dark` in `index.css`), never a literal hex/hsl value.
describe('codeBlockSyntaxTheme', () => {
  it('strips the hard-coded background from both the code and pre base entries', () => {
    expect(codeBlockSyntaxTheme['code[class*="language-"]']?.background).toBe(
      'transparent',
    );
    expect(codeBlockSyntaxTheme['pre[class*="language-"]']?.background).toBe(
      'transparent',
    );
  });

  it("zeroes the pre entry's margin and top corners so it sits flush under the figure's filename bar", () => {
    const preEntry = codeBlockSyntaxTheme['pre[class*="language-"]'];

    expect(preEntry?.margin).toBe(0);
    expect(preEntry?.borderTopLeftRadius).toBe(0);
    expect(preEntry?.borderTopRightRadius).toBe(0);
  });

  it('colors every core Prism token class with a var(--code-*) custom property', () => {
    const tokenKeys = [
      'comment',
      'keyword',
      'property',
      'tag',
      'string',
      'variable',
      'operator',
      'function',
      'constant',
      'number',
      'url',
    ];

    tokenKeys.forEach((key) => {
      expect(codeBlockSyntaxTheme[key]?.color).toMatch(/^var\(--code-/);
    });
  });
});
