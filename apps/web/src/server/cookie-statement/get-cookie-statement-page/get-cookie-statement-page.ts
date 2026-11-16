import type { TMaybeUndefined } from '@shinefold/config';
import { service, type TCookieStatementPage } from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getCookieStatementPage = cache(
  async (): Promise<TResult<TMaybeUndefined<TCookieStatementPage>>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.cookieStatement.v1.getCookieStatementPage(
      sanityContext,
    );
  },
);
