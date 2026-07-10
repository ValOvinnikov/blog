import { useMemo } from 'react';

import type { TToken } from '../parse-theme-tokens';
import { useTokenValues } from '../use-token-values';

export type TKvListProps = {
  tokens: TToken[];
};

/** Name/value grid for tokens whose light-mode resolved value is the useful signal (spacing, motion). */
export const KvList = ({ tokens }: TKvListProps) => {
  const cssVars = useMemo(() => tokens.map((t) => t.cssVar), [tokens]);
  const values = useTokenValues(cssVars);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
      {tokens.map((token) => (
        <div key={token.cssVar} className="contents">
          <dt className="font-mono text-label">{token.name}</dt>
          <dd className="text-text-muted">{values[token.cssVar]?.light}</dd>
        </div>
      ))}
    </dl>
  );
};
