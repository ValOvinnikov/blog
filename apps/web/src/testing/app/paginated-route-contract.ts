import {
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  type ITenantLocalizedParams,
} from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import type { IRouteProps } from '@web/testing/app/page-route-contract';
import { customRenderAsync } from '@web/testing/custom-render';
import type { ReactNode } from 'react';

type TPageParams = ITenantLocalizedParams & { page: string };

interface IPaginatedRouteContractOptions<TParams extends TPageParams> {
  page: (props: IRouteProps<TParams>) => Promise<ReactNode>;
  paramsFor: (page: string) => NoInfer<Promise<TParams>>;
  firstPageHref: string;
}

export const testPaginatedRouteContract = <TParams extends TPageParams>({
  page,
  paramsFor,
  firstPageHref,
}: IPaginatedRouteContractOptions<TParams>) => {
  const setup = customRenderAsync(page, { params: paramsFor(String(1)) });

  describe('paginated route contract', () => {
    it('redirects page 1 to its own first-page URL', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(permanentRedirect).toHaveBeenCalledWith({
        href: firstPageHref,
        locale: LOCALE_ISO_CODES.EN,
      });
    });
  });
};
