import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildSectionDocumentMetadata } from '@web/metadata/section-document-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PrivacyDocumentPage, { generateMetadata, revalidate } from './page';

faker.seed(6522);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams({ slug: MOCK_SLUG });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/components/pages/section-document-page', () => ({
  SectionDocumentPage: ({ type, slug }: { type: string; slug: string }) => (
    <div data-testid="section-document-page">
      {type}:{slug}
    </div>
  ),
}));

vi.mock('@web/metadata/section-document-metadata', () => ({
  buildSectionDocumentMetadata: vi.fn(),
}));

const setup = customRenderAsync(PrivacyDocumentPage, { params });

describe(`<${PrivacyDocumentPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders the privacy document with the resolved slug', () => {
    const page = screen.getByTestId('section-document-page');

    expect(page).toHaveTextContent(`page_privacyDocument:${MOCK_SLUG}`);
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildSectionDocumentMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the privacy document metadata built for the resolved slug', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildSectionDocumentMetadata).toHaveBeenCalledWith(
      'page_privacyDocument',
      MOCK_SLUG,
    );
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
