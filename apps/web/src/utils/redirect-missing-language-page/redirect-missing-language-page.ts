import { routes, type TMaybeUndefined } from '@blog/config';
import type { TResult } from '@blog/utils';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { redirect } from 'next/navigation';

export const redirectMissingLanguagePage = async <T>(
  result: TResult<TMaybeUndefined<T>>,
): Promise<void> => {
  const { locale, defaultLocale = routing.defaultLocale } =
    await getRequestContext();

  if (result.ok && !result.data && locale !== defaultLocale) {
    redirect(routes.home());
  }
};
