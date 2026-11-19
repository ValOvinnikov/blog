import { routes } from '@shinefold/config';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import {
  MOCK_SECOND_PAGE,
  testPaginatedRouteContract,
} from '@web/testing/app/paginated-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';

import TagNumberedPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug, page }: { slug: string; page: number }) => (
    <div data-testid="tag-page">{`${slug}:${page}`}</div>
  ),
}));

const paramsFor = (page: string) =>
  mockRouteParams({ slug: MOCK_TAG_SLUG, page });

const params = paramsFor(MOCK_SECOND_PAGE);

const setup = customRenderAsync(TagNumberedPage, { params });

testPageRouteContract({
  page: TagNumberedPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTagMetadata,
  buildMetadataArgs: [MOCK_TAG_SLUG, Number(MOCK_SECOND_PAGE)],
});

testPaginatedRouteContract({
  page: TagNumberedPage,
  paramsFor,
  firstPageHref: routes.tag(MOCK_TAG_SLUG, 1),
});

describe(`<${TagNumberedPage.name}/>`, () => {
  it('renders TagPage for the requested slug and page', async () => {
    await setup();

    const tagPage = screen.getByTestId('tag-page');

    expect(tagPage).toHaveTextContent(`${MOCK_TAG_SLUG}:${MOCK_SECOND_PAGE}`);
  });
});
