import { HTTP_STATUS } from '@blog/config/constants';
import {
  BILLING_LOG,
  STRIPE_SIGNATURE_HEADER,
} from '@platform/constants/billing';
import { handleStripeEvent } from '@platform/server/billing/handle-stripe-event';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

const respond = (status: number): NextResponse =>
  new NextResponse(null, { status });

export async function POST(request: Request): Promise<NextResponse> {
  const secret = stripeEnv.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();
  if (!secret || !stripe) {
    logger.error(BILLING_LOG.WEBHOOK_SECRET_MISSING);
    return respond(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const signature = request.headers.get(STRIPE_SIGNATURE_HEADER);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature ?? '',
      secret,
    );
  } catch {
    logger.warn(BILLING_LOG.WEBHOOK_SIGNATURE_INVALID);
    return respond(HTTP_STATUS.BAD_REQUEST);
  }

  try {
    await handleStripeEvent(stripe, event);
  } catch (error) {
    logger.error(BILLING_LOG.WEBHOOK_HANDLER_FAILED, {
      eventId: event.id,
      type: event.type,
      ...toLoggableError(error),
    });
    return respond(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return respond(HTTP_STATUS.OK);
}
