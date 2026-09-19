import type { TToken } from '../parse-theme-tokens';

export type TKvListProps = {
  tokens: TToken[];
};

export const KvList = ({ tokens }: TKvListProps) => (
  <dl className="space-y-2">
    {tokens.map((token) => (
      <div key={token.cssVar} className="flex items-baseline gap-4">
        <dt className="w-28 shrink-0 font-mono text-label text-text-subtle">
          {token.name}
        </dt>
        <dd className="font-mono text-copy text-text">{token.value}</dd>
      </div>
    ))}
  </dl>
);
