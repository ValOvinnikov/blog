import type { TValueOf } from '@blog/config/utils';

export const OPERATOR_ALERT_KIND = {
  OWNER_ELEVATION: 'OWNER_ELEVATION',
  DOCUMENT_VALIDATION: 'DOCUMENT_VALIDATION',
} as const;

export type TOperatorAlertKind = TValueOf<typeof OPERATOR_ALERT_KIND>;

export type TOperatorAlertBody =
  | {
      kind: typeof OPERATOR_ALERT_KIND.OWNER_ELEVATION;
      tenantId: string;
      outcome: 'STALLED' | 'AMBIGUOUS_MEMBERSHIP';
    }
  | {
      kind: typeof OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION;
      tenantId: string;
      invalidDocumentCount: number;
      isCritical: boolean;
    };
