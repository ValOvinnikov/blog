import type { TMaybeNull } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { permanentRedirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import { notFound } from 'next/navigation';

export const resolveNumberedPage = async (
  rawPage: string,
  firstPageHref: string,
): Promise<number> => {
  const page = parsePageParam(rawPage);

  if (isNull(page)) {
    notFound();
  }

  if (page === 1) {
    const { locale } = await getRequestContext();
    permanentRedirect({ href: firstPageHref, locale });
  }

  return page;
};

export const toNumberedMetadataPage = (rawPage: string): TMaybeNull<number> => {
  const page = parsePageParam(rawPage);
  return isNull(page) || page === 1 ? null : page;
};
