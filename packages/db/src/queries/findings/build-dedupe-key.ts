import type { TFindingKind, TFindingSource } from '@blog/config/constants';

export type TDedupeKeyParts = {
  tenantId?: string;
  source: TFindingSource;
  kind: TFindingKind;
  identifier: string;
};

export function buildDedupeKey(parts: TDedupeKeyParts): string {
  return [
    parts.source,
    parts.kind,
    parts.tenantId ?? 'global',
    parts.identifier,
  ].join(':');
}
