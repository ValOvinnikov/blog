import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import BlogPostSlugPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams({ slug: MOCK_SLUG });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/post-metadata', () => ({
  buildPostMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/blog-post-page', () => ({
  BlogPostPage: ({ slug }: { slug: string }) => (
    <div data-testid="blog-post-page">{slug}</div>
  ),
}));

const setup = customRenderAsync(BlogPostSlugPage, { params });

describe(`<${BlogPostSlugPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders BlogPostPage with the resolved slug', () => {
    const blogPostPage = screen.getByTestId('blog-post-page');

    expect(blogPostPage).toHaveTextContent(MOCK_SLUG);
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildPostMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the post metadata built for the resolved slug', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildPostMetadata).toHaveBeenCalledWith(MOCK_SLUG);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
