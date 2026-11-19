import { faker } from '@faker-js/faker';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TagDetailPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();

const params = mockRouteParams({ slug: MOCK_SLUG });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug }: { slug: string }) => (
    <div data-testid="tag-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn(),
}));

const setup = customRenderAsync(TagDetailPage, { params });

testPageRouteContract({
  page: TagDetailPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTagMetadata,
  buildMetadataArgs: [MOCK_SLUG],
});

describe(`<${TagDetailPage.name}/>`, () => {
  it('renders TagPage with the resolved slug', async () => {
    await setup();

    const tagPage = screen.getByTestId('tag-page');

    expect(tagPage).toHaveTextContent(MOCK_SLUG);
  });
});
