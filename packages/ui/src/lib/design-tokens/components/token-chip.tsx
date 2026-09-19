export type TTokenChipProps = {
  value: string;
  scheme: 'light' | 'dark';
};

/** A neutral border keeps near-white and near-black chips legible against the page. */
export const TokenChip = ({ value, scheme }: TTokenChipProps) => {
  const chip = (
    <span
      className="block h-9 w-16 rounded-md border border-black/10"
      style={{ background: value }}
    />
  );

  return scheme === 'dark' ? <span className="dark block">{chip}</span> : chip;
};
