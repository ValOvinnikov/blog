import type { TToken } from '../parse-theme-tokens';

import { TokenChip } from './token-chip';

export type TColorTableProps = {
  tokens: TToken[];
};

/**
 * Table of colour tokens: `token · role · light · dark`. Each swatch renders
 * the token via `var()` inside the matching theme scope, so both modes show
 * their true colour side by side (no live `getComputedStyle` needed).
 */
export const ColorTable = ({ tokens }: TColorTableProps) => (
  <table className="w-full text-left">
    <thead>
      <tr className="font-mono text-label text-text-subtle uppercase">
        <th className="pb-3 font-normal">Token</th>
        <th className="pb-3 font-normal">Role</th>
        <th className="pb-3 font-normal">Light</th>
        <th className="pb-3 font-normal">Dark</th>
      </tr>
    </thead>
    <tbody>
      {tokens.map((token) => (
        <tr key={token.cssVar} className="border-t border-border">
          <td className="py-3 font-mono text-label">{token.name}</td>
          <td className="py-3 text-text-muted">{token.role}</td>
          <td className="py-3">
            <TokenChip cssVar={token.cssVar} scheme="light" />
          </td>
          <td className="py-3">
            <TokenChip cssVar={token.cssVar} scheme="dark" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
