import type { TMaybeNull } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { localizeForRequest } from '@web/server/request-context/localize-for-request/localize-for-request';
import { parsePageParam } from '@web/utils/parse-page-param';
import { notFound, permanentRedirect } from 'next/navigation';

export const resolveNumberedPage = async (
  rawPage: string,
  firstPageHref: string,
): Promise<number> => {
  const page = parsePageParam(rawPage);

  if (isNull(page)) {
    notFound();
  }

  if (page === 1) {
    permanentRedirect(await localizeForRequest(firstPageHref));
  }

  return page;
};

export const toNumberedMetadataPage = (rawPage: string): TMaybeNull<number> => {
  const page = parsePageParam(rawPage);
  return isNull(page) || page === 1 ? null : page;
};
