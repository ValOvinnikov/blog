export type TTokenChipProps = {
  /**
   * The token's value — a raw-palette `var(--…)` (e.g. `var(--bg)`), which the
   * `.dark` wrapper re-scopes for the dark column. Raw-palette vars always
   * exist (they aren't tree-shaken like the `@theme` `--color-*` aliases).
   */
  value: string;
  /** Which theme scope to resolve the value in. */
  scheme: 'light' | 'dark';
};

/**
 * A colour swatch. The dark column resolves the same `var()` inside a `.dark`
 * scope, so both modes show their true colour side by side. A neutral border
 * keeps near-white / near-black chips legible against the page.
 */
export const TokenChip = ({ value, scheme }: TTokenChipProps) => {
  const chip = (
    <span
      className="block h-9 w-16 rounded-md border border-black/10"
      style={{ background: value }}
    />
  );

  return scheme === 'dark' ? <span className="dark block">{chip}</span> : chip;
};
