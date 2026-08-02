import type { ReactNode } from 'react';

/**
 * Shared prop shape for components that accept an optional leading icon as a
 * `ReactNode` slot — the consumer builds it via `<Icon name={ICONS.X}>` and
 * passes it in, keeping the component itself icon-registry-agnostic.
 */
export interface IWithIcon {
  icon?: ReactNode;
}
