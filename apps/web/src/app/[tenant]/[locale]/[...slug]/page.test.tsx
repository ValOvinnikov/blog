import { faker } from '@faker-js/faker';
import { buildLandingPageMetadata } from '@web/metadata/landing-page-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import LandingSlugPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const [MOCK_SEGMENT, MOCK_NESTED_SEGMENT] = faker.helpers.uniqueArray(
  faker.lorem.slug,
  2,
) as [string, string];
const MOCK_NESTED_PATH = `${MOCK_SEGMENT}/${MOCK_NESTED_SEGMENT}`;

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

testPageRouteContract({
  page: LandingSlugPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildLandingPageMetadata,
  buildMetadataArgs: [MOCK_NESTED_PATH],
});

describe(`<${LandingSlugPage.name}/>`, () => {
  it.each([
    { label: 'a top-level', slug: [MOCK_SEGMENT], path: MOCK_SEGMENT },
    {
      label: 'a nested',
      slug: [MOCK_SEGMENT, MOCK_NESTED_SEGMENT],
      path: MOCK_NESTED_PATH,
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
