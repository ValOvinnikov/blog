import type { TPayOpenInvoiceResult } from '@platform/server/billing/pay-open-invoice-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const payOpenInvoiceAction = vi.fn(
  async (): Promise<TPayOpenInvoiceResult> => ({
    outcome: ACTION_OUTCOME.SERVER_ERROR,
  }),
);
