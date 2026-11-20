import type { TMoveUpQuoteResult } from '@platform/server/billing/get-move-up-quote-action';
import { MOCK_MOVE_UP_QUOTE } from '@platform/testing/billing/move-up';
import { okResult } from '@shinefold/utils';

export const getMoveUpQuoteAction = vi.fn(
  async (): Promise<TMoveUpQuoteResult> => okResult(MOCK_MOVE_UP_QUOTE),
);
