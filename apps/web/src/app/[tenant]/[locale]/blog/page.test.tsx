import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PostIndexRoute, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };
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

describe(`<${PostIndexRoute.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders PostIndexPage for page 1', () => {
    const postIndexPage = screen.getByTestId('post-index-page');

    expect(postIndexPage).toHaveTextContent(String(FIRST_PAGE));
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildPostIndexMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the post index metadata for page 1', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildPostIndexMetadata).toHaveBeenCalledWith(FIRST_PAGE);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
