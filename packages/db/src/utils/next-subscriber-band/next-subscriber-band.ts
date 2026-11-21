import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';

export function nextSubscriberBand(
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<TPaidSubscriberBandCeiling> {
  return PAID_SUBSCRIBER_BAND_CEILINGS[
    ceiling ? PAID_SUBSCRIBER_BAND_CEILINGS.indexOf(ceiling) + 1 : 0
  ];
}
