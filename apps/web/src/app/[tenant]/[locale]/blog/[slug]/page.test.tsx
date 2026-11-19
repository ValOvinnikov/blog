import { faker } from '@faker-js/faker';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import BlogPostSlugPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();

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

testPageRouteContract({
  page: BlogPostSlugPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildPostMetadata,
  buildMetadataArgs: [MOCK_SLUG],
});

describe(`<${BlogPostSlugPage.name}/>`, () => {
  it('renders BlogPostPage with the resolved slug', async () => {
    await setup();

    const blogPostPage = screen.getByTestId('blog-post-page');

    expect(blogPostPage).toHaveTextContent(MOCK_SLUG);
  });
});
