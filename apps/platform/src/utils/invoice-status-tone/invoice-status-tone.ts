import { BADGE_TONE } from '@platform/constants/badge-tone';
import {
  STRIPE_INVOICE_STATUS,
  type TBilledInvoiceStatus,
} from '@platform/constants/billing';
import type { TBadgeTone } from '@platform/utils/status-tone/status-tone';

const INVOICE_STATUS_TONE: Record<TBilledInvoiceStatus, TBadgeTone> = {
  [STRIPE_INVOICE_STATUS.OPEN]: BADGE_TONE.WARN,
  [STRIPE_INVOICE_STATUS.PAID]: BADGE_TONE.OK,
  [STRIPE_INVOICE_STATUS.UNCOLLECTIBLE]: BADGE_TONE.BAD,
  [STRIPE_INVOICE_STATUS.VOID]: BADGE_TONE.NEUTRAL,
};

export const invoiceStatusTone = (status: TBilledInvoiceStatus) =>
  INVOICE_STATUS_TONE[status];
