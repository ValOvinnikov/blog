import type { TToken } from '../parse-theme-tokens';

export type TSpacingSampleProps = {
  tokens: TToken[];
};

/**
 * Each spacing token as a tinted bar whose width equals the token, so the
 * relative scale is visible at a glance (clamp() tokens render at their
 * current-viewport width).
 */
export const SpacingSample = ({ tokens }: TSpacingSampleProps) => (
  <div className="space-y-3">
    {tokens.map((token) => (
      <div key={token.cssVar} className="flex items-center gap-4">
        <span className="w-32 shrink-0 font-mono text-label text-text-subtle">
          {token.name}
        </span>
        <span
          className="h-4 rounded-sm bg-accent"
          style={{ width: `var(${token.cssVar})` }}
        />
      </div>
    ))}
  </div>
);
