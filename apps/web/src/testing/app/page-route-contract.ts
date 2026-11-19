import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  type ITenantLocalizedParams,
} from '@shinefold/config';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync } from '@web/testing/custom-render';
import { createMockFaker } from '@web/testing/mock-faker';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const mockFaker = createMockFaker(7648);

const MOCK_METADATA: Metadata = { title: mockFaker.lorem.words(2) };

export interface IRouteProps<TParams extends ITenantLocalizedParams> {
  params: Promise<TParams>;
}

interface IPageRouteContractOptions<
  TParams extends ITenantLocalizedParams,
  TArgs extends unknown[],
> {
  page: (props: IRouteProps<TParams>) => Promise<ReactNode>;
  generateMetadata: (props: IRouteProps<TParams>) => Promise<Metadata>;
  revalidate: number;
  params: NoInfer<Promise<TParams>>;
  buildMetadata: (...args: TArgs) => Promise<Metadata>;
  buildMetadataArgs: NoInfer<TArgs>;
}

export const testPageRouteContract = <
  TParams extends ITenantLocalizedParams,
  TArgs extends unknown[],
>({
  page,
  generateMetadata,
  revalidate,
  params,
  buildMetadata,
  buildMetadataArgs,
}: IPageRouteContractOptions<TParams, TArgs>) => {
  describe('page route contract', () => {
    describe(`<${page.name}/>`, () => {
      it('declares the shared content-route revalidate backstop', () => {
        expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
      });

      it('enters the request context with the route params', async () => {
        await customRenderAsync(page, { params })();

        expect(enterRequestContext).toHaveBeenCalledWith(params);
      });
    });

    describe(generateMetadata, () => {
      let metadata: Metadata;

      beforeEach(async () => {
        vi.mocked(buildMetadata).mockResolvedValue(MOCK_METADATA);
        metadata = await generateMetadata({ params });
      });

      it('returns the metadata built for the route', () => {
        expect(metadata).toBe(MOCK_METADATA);
      });

      it('builds the metadata from the route params', () => {
        expect(buildMetadata).toHaveBeenCalledWith(...buildMetadataArgs);
      });

      it('enters the request context from the route params', () => {
        expect(enterRequestContext).toHaveBeenCalledWith(params);
      });

      it('enters the request context before building the metadata', () => {
        const [enteredAt] =
          vi.mocked(enterRequestContext).mock.invocationCallOrder;
        const [builtAt] = vi.mocked(buildMetadata).mock.invocationCallOrder;

        expect(builtAt).toBeGreaterThan(enteredAt ?? Number.POSITIVE_INFINITY);
      });
    });
  });
};
