import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PostIndexRoute, { generateMetadata, revalidate } from './page';

const FIRST_PAGE = 1;

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/post-index-metadata', () => ({
  buildPostIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/post-index-page', () => ({
  PostIndexPage: ({ page }: { page: number }) => (
    <div data-testid="post-index-page">{page}</div>
  ),
}));

const setup = customRenderAsync(PostIndexRoute, { params });

testPageRouteContract({
  page: PostIndexRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildPostIndexMetadata,
  buildMetadataArgs: [FIRST_PAGE],
});

describe(`<${PostIndexRoute.name}/>`, () => {
  it('renders PostIndexPage for page 1', async () => {
    await setup();

    const postIndexPage = screen.getByTestId('post-index-page');

    expect(postIndexPage).toHaveTextContent(String(FIRST_PAGE));
  });
});
