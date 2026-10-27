import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildHomePageMetadata } from '@web/metadata/home-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import HomeRoute, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/home-page-metadata', () => ({
  buildHomePageMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/home-page', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

const setup = customRenderAsync(HomeRoute, { params });

describe(`<${HomeRoute.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders HomePage', () => {
    const homePage = screen.getByTestId('home-page');

    expect(homePage).toBeVisible();
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildHomePageMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the home page metadata', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
