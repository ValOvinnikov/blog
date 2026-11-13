import 'server-only';

import { queries } from '@blog/db';
import type Stripe from 'stripe';

import { CATALOGUE_PROMOTION_CODE_EXPAND } from './catalogue-expand';
import { toCataloguePromotionCode } from './to-catalogue-promotion-code';
import { toListExpand } from './to-list-expand';

export const saveOrRemoveCataloguePromotionCode = async (
  promotionCode: Stripe.PromotionCode,
): Promise<void> => {
  const cataloguePromotionCode = toCataloguePromotionCode(promotionCode);
  if (cataloguePromotionCode) {
    await queries.stripeCatalogue.saveStripePromotionCode(
      cataloguePromotionCode,
    );
  } else {
    await queries.stripeCatalogue.removeStripePromotionCode(promotionCode.id);
  }
};

export const syncCataloguePromotionCode = async (
  stripe: Stripe,
  promotionCodeId: string,
): Promise<void> => {
  const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId, {
    expand: CATALOGUE_PROMOTION_CODE_EXPAND,
  });
  await saveOrRemoveCataloguePromotionCode(promotionCode);
};

export const syncCouponPromotionCodes = async (
  stripe: Stripe,
  couponId: string,
): Promise<void> => {
  for await (const promotionCode of stripe.promotionCodes.list({
    coupon: couponId,
    expand: toListExpand(CATALOGUE_PROMOTION_CODE_EXPAND),
  })) {
    await saveOrRemoveCataloguePromotionCode(promotionCode);
  }
};
