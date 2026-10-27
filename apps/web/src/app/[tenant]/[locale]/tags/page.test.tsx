import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildTagIndexMetadata } from '@web/metadata/tag-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TagIndexRoute, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/tag-index-metadata', () => ({
  buildTagIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/tag-index-page', () => ({
  TagIndexPage: () => <div data-testid="tag-index-page" />,
}));

const setup = customRenderAsync(TagIndexRoute, { params });

describe(`<${TagIndexRoute.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders TagIndexPage', () => {
    const tagIndexPage = screen.getByTestId('tag-index-page');

    expect(tagIndexPage).toBeVisible();
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildTagIndexMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the tag index metadata', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
