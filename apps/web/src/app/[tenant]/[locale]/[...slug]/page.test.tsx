import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildLandingPageMetadata } from '@web/metadata/landing-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import LandingSlugPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const [MOCK_SEGMENT, MOCK_NESTED_SEGMENT] = faker.helpers.uniqueArray(
  faker.lorem.slug,
  2,
) as [string, string];
const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams({ slug: [MOCK_SEGMENT, MOCK_NESTED_SEGMENT] });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/landing-page-metadata', () => ({
  buildLandingPageMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/landing-page', () => ({
  LandingPage: ({ path }: { path: string }) => (
    <div data-testid="landing-page">{path}</div>
  ),
}));

const setup = customRenderAsync(LandingSlugPage, { params });

describe(`<${LandingSlugPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    await setup();

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it.each([
    { label: 'a top-level', slug: [MOCK_SEGMENT], path: MOCK_SEGMENT },
    {
      label: 'a nested',
      slug: [MOCK_SEGMENT, MOCK_NESTED_SEGMENT],
      path: `${MOCK_SEGMENT}/${MOCK_NESTED_SEGMENT}`,
    },
  ])(
    'renders LandingPage with the joined path of $label page',
    async ({ slug, path }) => {
      await setup({ params: mockRouteParams({ slug }) });

      const landingPage = screen.getByTestId('landing-page');

      expect(landingPage).toHaveTextContent(path);
    },
  );
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildLandingPageMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the landing metadata built for the joined path', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildLandingPageMetadata).toHaveBeenCalledWith(
      `${MOCK_SEGMENT}/${MOCK_NESTED_SEGMENT}`,
    );
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
