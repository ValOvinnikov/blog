import {
  NEXT_NAVIGATION_ERROR,
  type ITenantLocalizedParams,
} from '@shinefold/config';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { IRouteProps } from '@web/testing/app/page-route-contract';
import { customRenderAsync } from '@web/testing/custom-render';
import { permanentRedirect } from 'next/navigation';
import type { ReactNode } from 'react';

export const MOCK_SECOND_PAGE = '2';

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

      expect(permanentRedirect).toHaveBeenCalledWith(firstPageHref);
    });

    it('enters the request context before redirecting page 1', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      const [enteredAt] =
        vi.mocked(enterRequestContext).mock.invocationCallOrder;
      const [redirectedAt] =
        vi.mocked(permanentRedirect).mock.invocationCallOrder;

      expect(redirectedAt).toBeGreaterThan(
        enteredAt ?? Number.POSITIVE_INFINITY,
      );
    });
  });
};
