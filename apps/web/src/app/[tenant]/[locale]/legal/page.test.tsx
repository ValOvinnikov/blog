import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildSectionIndexMetadata } from '@web/metadata/section-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import LegalIndexRoute, { generateMetadata, revalidate } from './page';

faker.seed(6524);

const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/components/pages/section-index-page', () => ({
  SectionIndexPage: ({ type }: { type: string }) => (
    <div data-testid="section-index-page">{type}</div>
  ),
}));

vi.mock('@web/metadata/section-index-metadata', () => ({
  buildSectionIndexMetadata: vi.fn(),
}));

const setup = customRenderAsync(LegalIndexRoute, { params });

describe(`<${LegalIndexRoute.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders the legal hub', () => {
    const page = screen.getByTestId('section-index-page');

    expect(page).toHaveTextContent('page_legalIndex');
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildSectionIndexMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the legal hub metadata', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildSectionIndexMetadata).toHaveBeenCalledWith('page_legalIndex');
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
