import type { TMaybeUndefined } from '@blog/config';
import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import { getLocale } from 'next-intl/server';

export const getSubscribedPageLocale = async (): Promise<
  TMaybeUndefined<TLocaleIsoCode>
> => {
  const locale = await getLocale();
  return isLocaleIsoCode(locale) ? locale : undefined;
};
