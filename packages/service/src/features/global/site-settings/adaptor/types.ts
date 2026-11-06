import type { Settings_site } from '@blog/config';

export type TSiteSettings = {
  currency: NonNullable<Settings_site['currency']>;
};
