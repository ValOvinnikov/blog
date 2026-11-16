import 'server-only';

import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import { queries } from '@shinefold/db';
import type Stripe from 'stripe';

import { syncCataloguePrice } from './sync-catalogue-price';
import {
  syncCataloguePromotionCode,
  syncCouponPromotionCodes,
} from './sync-catalogue-promotion-code';

export const handleCatalogueEvent = async (
  stripe: Stripe,
  event: Stripe.Event,
): Promise<boolean> => {
  switch (event.type) {
    case STRIPE_EVENT_TYPE.PRICE_CREATED:
    case STRIPE_EVENT_TYPE.PRICE_UPDATED:
      await syncCataloguePrice(stripe, event.data.object.id);
      return true;
    case STRIPE_EVENT_TYPE.PRICE_DELETED:
      await queries.stripeCatalogue.removeStripePrice(event.data.object.id);
      return true;
    case STRIPE_EVENT_TYPE.PROMOTION_CODE_CREATED:
    case STRIPE_EVENT_TYPE.PROMOTION_CODE_UPDATED:
      await syncCataloguePromotionCode(stripe, event.data.object.id);
      return true;
    case STRIPE_EVENT_TYPE.COUPON_DELETED:
      await syncCouponPromotionCodes(stripe, event.data.object.id);
      return true;
    default:
      return false;
  }
};
