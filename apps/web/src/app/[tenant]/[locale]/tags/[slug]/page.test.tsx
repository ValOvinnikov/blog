import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TagDetailPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };

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

describe(`<${TagDetailPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders TagPage with the resolved slug', () => {
    const tagPage = screen.getByTestId('tag-page');

    expect(tagPage).toHaveTextContent(MOCK_SLUG);
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildTagMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the tag metadata built for the resolved slug', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTagMetadata).toHaveBeenCalledWith(MOCK_SLUG);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
