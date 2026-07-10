export type TTokenChipProps = {
  /** The full custom property, e.g. `--color-accent`. */
  cssVar: string;
  /** Which theme scope to resolve the value in. */
  scheme: 'light' | 'dark';
};

/**
 * A swatch that renders a colour token by *using* it in a real `background`
 * property (so the browser resolves the `var()` chain, unlike reading the
 * custom property directly, which returns the unsubstituted `var(--x)`).
 * The dark column is resolved inside a `.dark` scope. A neutral border keeps
 * near-white / near-black chips legible against the page.
 */
export const TokenChip = ({ cssVar, scheme }: TTokenChipProps) => {
  const chip = (
    <span
      className="block h-9 w-16 rounded-md border border-black/10"
      style={{ background: `var(${cssVar})` }}
    />
  );

  return scheme === 'dark' ? <span className="dark block">{chip}</span> : chip;
};
