import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import { getLocale } from 'next-intl/server';

export const getSubscribedPageLocale = async (): Promise<
  TLocaleIsoCode | undefined
> => {
  const locale = await getLocale();
  return isLocaleIsoCode(locale) ? locale : undefined;
};
