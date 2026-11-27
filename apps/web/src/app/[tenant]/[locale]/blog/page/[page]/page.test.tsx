import { routes } from '@shinefold/config';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import {
  MOCK_SECOND_PAGE,
  testPaginatedRouteContract,
} from '@web/testing/app/paginated-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PostIndexNumberedPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/post-index-metadata', () => ({
  buildPostIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/post-index-page', () => ({
  PostIndexPage: ({ page }: { page: number }) => (
    <div data-testid="post-index-page">{page}</div>
  ),
}));

const paramsFor = (page: string) => mockRouteParams({ page });

const params = paramsFor(MOCK_SECOND_PAGE);

const setup = customRenderAsync(PostIndexNumberedPage, { params });

testPageRouteContract({
  page: PostIndexNumberedPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildPostIndexMetadata,
  buildMetadataArgs: [Number(MOCK_SECOND_PAGE)],
});

testPaginatedRouteContract({
  page: PostIndexNumberedPage,
  paramsFor,
  firstPageHref: routes.blogIndex(1),
});

describe(`<${PostIndexNumberedPage.name}/>`, () => {
  it('renders PostIndexPage for the requested page', async () => {
    await setup();

    const postIndexPage = screen.getByTestId('post-index-page');

    expect(postIndexPage).toHaveTextContent(MOCK_SECOND_PAGE);
  });
});
