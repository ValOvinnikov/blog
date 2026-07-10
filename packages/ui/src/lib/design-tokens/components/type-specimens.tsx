import type { CSSProperties } from 'react';

import type { TToken } from '../parse-theme-tokens';

export type TTypeSpecimensProps = {
  tokens: TToken[];
  fontOnly?: boolean;
};

/**
 * Renders one specimen line per typography or font token, styled with the
 * token's own `var()` value so the gallery always reflects the live theme.
 */
export const TypeSpecimens = ({ tokens, fontOnly }: TTypeSpecimensProps) => (
  <div className="space-y-6">
    {tokens.map((token) => {
      const style: CSSProperties = fontOnly
        ? { fontFamily: `var(${token.cssVar})` }
        : { fontSize: `var(${token.cssVar})` };
      const descriptor = fontOnly ? `font-${token.name}` : `text-${token.name}`;

      return (
        <div key={token.cssVar}>
          <p className="mb-1 font-mono text-label text-text-subtle uppercase">
            {descriptor}
          </p>
          <p style={style}>The quick brown fox jumps over the lazy dog</p>
        </div>
      );
    })}
  </div>
);
