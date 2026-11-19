import { buildTagIndexMetadata } from '@web/metadata/tag-index-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TagIndexRoute, { generateMetadata, revalidate } from './page';

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/tag-index-metadata', () => ({
  buildTagIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/tag-index-page', () => ({
  TagIndexPage: () => <div data-testid="tag-index-page" />,
}));

const setup = customRenderAsync(TagIndexRoute, { params });

testPageRouteContract({
  page: TagIndexRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTagIndexMetadata,
  buildMetadataArgs: [],
});

describe(`<${TagIndexRoute.name}/>`, () => {
  it('renders TagIndexPage', async () => {
    await setup();

    const tagIndexPage = screen.getByTestId('tag-index-page');

    expect(tagIndexPage).toBeVisible();
  });
});
