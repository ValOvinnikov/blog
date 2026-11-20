import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';

export const nextSubscriberBand = (
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<TPaidSubscriberBandCeiling> =>
  PAID_SUBSCRIBER_BAND_CEILINGS[
    ceiling ? PAID_SUBSCRIBER_BAND_CEILINGS.indexOf(ceiling) + 1 : 0
  ];
