import type {
  Settings_site,
  TMaybeUndefined,
  TPricePeriod,
} from '@blog/config';

export type TSiteSettings = {
  currency: NonNullable<Settings_site['currency']>;
  pricePeriodWording: Record<TPricePeriod, TMaybeUndefined<string>>;
};
