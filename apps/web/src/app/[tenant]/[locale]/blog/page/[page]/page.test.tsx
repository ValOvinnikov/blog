import { faker } from '@faker-js/faker';
import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PostIndexNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };
const MOCK_PAGE = faker.number.int({ min: 2, max: 999 });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@web/metadata/post-index-metadata', () => ({
  buildPostIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/post-index-page', () => ({
  PostIndexPage: ({ page }: { page: number }) => (
    <div data-testid="post-index-page">{page}</div>
  ),
}));

const paramsFor = (page: string) => mockRouteParams({ page });

const pageParams = paramsFor(String(MOCK_PAGE));

const setup = customRenderAsync(PostIndexNumberedPage, { params: pageParams });

describe(`<${PostIndexNumberedPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders PostIndexPage for the requested page', async () => {
    await setup();

    const postIndexPage = screen.getByTestId('post-index-page');

    expect(postIndexPage).toHaveTextContent(String(MOCK_PAGE));
  });

  it('redirects page 1 to the blog index first page', async () => {
    await expect(setup({ params: paramsFor(String(1)) })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: routes.blogIndex(1),
      locale: LOCALE_ISO_CODES.EN,
    });
  });
});

describe(generateMetadata, () => {
  it('builds the post index metadata for the requested page', async () => {
    vi.mocked(buildPostIndexMetadata).mockResolvedValue(MOCK_METADATA);

    const metadata = await generateMetadata({ params: pageParams });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildPostIndexMetadata).toHaveBeenCalledWith(MOCK_PAGE);
  });
});
