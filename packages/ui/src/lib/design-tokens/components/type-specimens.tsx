import type { CSSProperties } from 'react';

import type { TToken } from '../parse-theme-tokens';

export type TTypeSpecimensProps = {
  tokens: TToken[];
  isFontOnly?: boolean;
};

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

export const TypeSpecimens = ({ tokens, isFontOnly }: TTypeSpecimensProps) => (
  <div className="divide-y divide-border">
    {tokens.map((token) => {
      const style: CSSProperties = isFontOnly
        ? { fontFamily: token.value }
        : { fontSize: token.value };
      const descriptor = isFontOnly
        ? `font-${token.name}`
        : `text-${token.name}`;

      return (
        <div key={token.cssVar} className="py-5 first:pt-0">
          <p className="mb-2 font-mono text-label text-text-subtle uppercase">
            {descriptor}
          </p>
          <p style={style}>{SAMPLE}</p>
        </div>
      );
    })}
  </div>
);
