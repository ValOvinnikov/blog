import { useMemo } from 'react';

import type { TToken } from '../parse-theme-tokens';
import { useTokenValues } from '../use-token-values';

import { TokenChip } from './token-chip';

export type TColorTableProps = {
  tokens: TToken[];
};

/** Table of colour tokens, resolving each token's light/dark values live. */
export const ColorTable = ({ tokens }: TColorTableProps) => {
  const cssVars = useMemo(() => tokens.map((t) => t.cssVar), [tokens]);
  const values = useTokenValues(cssVars);

  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          <th className="font-mono text-label text-text-subtle uppercase">
            Token
          </th>
          <th className="font-mono text-label text-text-subtle uppercase">
            Role
          </th>
          <th className="font-mono text-label text-text-subtle uppercase">
            Light
          </th>
          <th className="font-mono text-label text-text-subtle uppercase">
            Dark
          </th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const resolved = values[token.cssVar];
          return (
            <tr key={token.cssVar} className="border-t border-border py-3">
              <td className="font-mono text-label">{token.name}</td>
              <td className="text-text-muted">{token.role}</td>
              <td>{resolved && <TokenChip value={resolved.light} />}</td>
              <td>{resolved && <TokenChip value={resolved.dark} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
