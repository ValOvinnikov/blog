import type { TToken } from '../parse-theme-tokens';

export type TShapeSampleProps = {
  tokens: TToken[];
};

/**
 * Radius boxes, one per token, sized identically so the corner rounding is
 * comparable. Tinted fill + accent border make each radius clearly visible
 * (a white-on-white box reads as square).
 */
export const ShapeSample = ({ tokens }: TShapeSampleProps) => (
  <div className="flex flex-wrap gap-8">
    {tokens.map((token) => (
      <div key={token.cssVar} className="flex flex-col items-center gap-2">
        <div
          className="h-20 w-20 border border-accent bg-accent-muted"
          style={{ borderRadius: token.value }}
        />
        <p className="font-mono text-label text-text-subtle">
          {token.name} · {token.value}
        </p>
      </div>
    ))}
  </div>
);
