import type { CSSProperties } from 'react';

import type { TToken } from '../parse-theme-tokens';

export type TTypeSpecimensProps = {
  tokens: TToken[];
  fontOnly?: boolean;
};

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

/**
 * One specimen row per typography or font token, styled with the token's own
 * declared value. Rows are divided by a hairline so each specimen is clearly
 * separated (mirrors the colour table's row rhythm).
 */
export const TypeSpecimens = ({ tokens, fontOnly }: TTypeSpecimensProps) => (
  <div className="divide-y divide-border">
    {tokens.map((token) => {
      const style: CSSProperties = fontOnly
        ? { fontFamily: token.value }
        : { fontSize: token.value };
      const descriptor = fontOnly ? `font-${token.name}` : `text-${token.name}`;

      return (
        <div key={token.cssVar} className="py-5">
          <p className="mb-2 font-mono text-label text-text-subtle uppercase">
            {descriptor}
          </p>
          <p style={style}>{SAMPLE}</p>
        </div>
      );
    })}
  </div>
);
