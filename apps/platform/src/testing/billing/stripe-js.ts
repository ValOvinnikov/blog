import {
  STRIPE_JS_ERROR_CODE,
  STRIPE_JS_ERROR_TYPE,
} from '@platform/constants/stripe-payment';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

export const MOCK_BANK_STEP_CANCELLED = {
  error: {
    type: STRIPE_JS_ERROR_TYPE.CARD_ERROR,
    code: STRIPE_JS_ERROR_CODE.AUTHENTICATION_FAILURE,
  },
};

export const mockStripeNextAction = () => {
  const handleNextAction = vi.fn<(...args: unknown[]) => Promise<unknown>>(
    async () => ({}),
  );
  vi.mocked(loadStripe).mockResolvedValue({
    handleNextAction,
  } as unknown as Stripe);
  return handleNextAction;
};
