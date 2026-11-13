import type { TStatusBadgeProps } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import {
  STRIPE_INVOICE_STATUS,
  type TStripeInvoiceStatus,
} from '@platform/constants/billing';

const INVOICE_STATUS_TONE: Record<
  TStripeInvoiceStatus,
  NonNullable<TStatusBadgeProps['tone']>
> = {
  [STRIPE_INVOICE_STATUS.DRAFT]: BADGE_TONE.NEUTRAL,
  [STRIPE_INVOICE_STATUS.OPEN]: BADGE_TONE.WARN,
  [STRIPE_INVOICE_STATUS.PAID]: BADGE_TONE.OK,
  [STRIPE_INVOICE_STATUS.UNCOLLECTIBLE]: BADGE_TONE.BAD,
  [STRIPE_INVOICE_STATUS.VOID]: BADGE_TONE.NEUTRAL,
};

export const invoiceStatusTone = (status: TStripeInvoiceStatus) =>
  INVOICE_STATUS_TONE[status];
