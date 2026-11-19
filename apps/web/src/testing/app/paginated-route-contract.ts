import {
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  type ITenantLocalizedParams,
} from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { IRouteProps } from '@web/testing/app/page-route-contract';
import { customRenderAsync } from '@web/testing/custom-render';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

const FIRST_PAGE = '1';
const MOCK_NON_CANONICAL_PAGES = ['abc', '02'];

type TPageParams = ITenantLocalizedParams & { page: string };

interface IPaginatedRouteContractOptions<TParams extends TPageParams> {
  page: (props: IRouteProps<TParams>) => Promise<ReactNode>;
  generateMetadata: (props: IRouteProps<TParams>) => Promise<Metadata>;
  paramsFor: (page: string) => NoInfer<Promise<TParams>>;
  buildMetadata: (...args: never[]) => Promise<Metadata>;
  firstPageHref: string;
}

export const testPaginatedRouteContract = <TParams extends TPageParams>({
  page,
  generateMetadata,
  paramsFor,
  buildMetadata,
  firstPageHref,
}: IPaginatedRouteContractOptions<TParams>) => {
  const firstPageParams = paramsFor(FIRST_PAGE);
  const setup = customRenderAsync(page, { params: firstPageParams });

  describe('paginated route contract', () => {
    it('redirects page 1 to the canonical first-page URL', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(enterRequestContext).toHaveBeenCalledWith(firstPageParams);
      expect(permanentRedirect).toHaveBeenCalledWith({
        href: firstPageHref,
        locale: LOCALE_ISO_CODES.EN,
      });
    });

    it.each(MOCK_NON_CANONICAL_PAGES)(
      'hard-404s a non-canonical page param (%s)',
      async (pageParam) => {
        await expect(setup({ params: paramsFor(pageParam) })).rejects.toThrow(
          NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
        );

        expect(notFound).toHaveBeenCalledTimes(1);
      },
    );

    it.each([FIRST_PAGE, ...MOCK_NON_CANONICAL_PAGES])(
      'returns empty metadata without building any for page param %s',
      async (pageParam) => {
        const metadata = await generateMetadata({
          params: paramsFor(pageParam),
        });

        expect(metadata).toEqual({});
        expect(buildMetadata).not.toHaveBeenCalled();
      },
    );
  });
};
