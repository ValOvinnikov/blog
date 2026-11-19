import { buildHomePageMetadata } from '@web/metadata/home-page-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import HomeRoute, { generateMetadata, revalidate } from './page';

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/home-page-metadata', () => ({
  buildHomePageMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/home-page', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

const setup = customRenderAsync(HomeRoute, { params });

testPageRouteContract({
  page: HomeRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildHomePageMetadata,
  buildMetadataArgs: [],
});

describe(`<${HomeRoute.name}/>`, () => {
  it('renders HomePage', async () => {
    await setup();

    const homePage = screen.getByTestId('home-page');

    expect(homePage).toBeVisible();
  });
});
