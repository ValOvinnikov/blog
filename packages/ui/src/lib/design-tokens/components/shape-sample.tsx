import type { TToken } from '../parse-theme-tokens';

export type TShapeSampleProps = {
  tokens: TToken[];
};

/** Radius boxes, one per token, sized identically so proportions are comparable. */
export const ShapeSample = ({ tokens }: TShapeSampleProps) => (
  <div className="flex flex-wrap gap-8">
    {tokens.map((token) => (
      <div key={token.cssVar} className="flex flex-col items-center gap-2">
        <div
          className="h-16 w-16 border border-border-strong bg-surface"
          style={{ borderRadius: `var(${token.cssVar})` }}
        />
        <p className="font-mono text-label text-text-subtle uppercase">
          {token.name}
        </p>
      </div>
    ))}
  </div>
);
