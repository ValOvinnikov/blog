export type TTokenChipProps = {
  value: string;
};

/** A small swatch rendering a single resolved token value as a background colour. */
export const TokenChip = ({ value }: TTokenChipProps) => (
  <span
    className="inline-block h-8 w-14 rounded-sm border border-border align-middle"
    style={{ background: value }}
  />
);
