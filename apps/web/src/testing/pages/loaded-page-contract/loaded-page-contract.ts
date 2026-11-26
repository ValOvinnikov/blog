import {
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@shinefold/config';
import { okResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import {
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testThrowsOnFetchFailure,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
import { notFound, redirect } from 'next/navigation';
import type { Mock } from 'vitest';

const { EN, NL } = LOCALE_ISO_CODES;

interface IWithPageLoader {
  pageLoaderMock: Mock;
  setup: TAsyncSetup;
}

interface ILoadedPageContractOptions<TData> extends IWithPageLoader {
  successData: TData;
  loaderArgs: unknown[];
  logEvent: string;
  logContext?: Record<string, unknown>;
  currentCrumb: string;
}

export const testLoadedPageContract = <TData>({
  pageLoaderMock,
  setup,
  successData,
  loaderArgs,
  logEvent,
  logContext,
  currentCrumb,
}: ILoadedPageContractOptions<TData>) => {
  testForwardsArgsToLoader({
    pageLoaderMock,
    setup,
    successData,
    description: 'fetches the page with the tenant context',
    expectedArgs: loaderArgs,
  });
  testThrowsOnFetchFailure({
    pageLoaderMock,
    setup,
    eventFragment: logEvent,
    logContext,
  });
  testBreadcrumbsTrail({
    pageLoaderMock,
    setup,
    successData,
    linkSteps: [{ label: MOCK_TENANT_NAME, href: routes.home() }],
    currentLabel: currentCrumb,
  });
};

export const testRedirectsMissingLanguagePage = ({
  pageLoaderMock,
  setup,
}: IWithPageLoader) => {
  it('redirects home when this language has no page', async () => {
    pageLoaderMock.mockResolvedValue(okResult());
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(routes.home());
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });
};
