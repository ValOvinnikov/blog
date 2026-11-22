import { faker } from '@faker-js/faker';
import { buildSectionDocumentMetadata } from '@web/metadata/section-document-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PrivacyDocumentPage, { generateMetadata, revalidate } from './page';

faker.seed(6522);

const MOCK_SLUG = faker.lorem.slug();

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

testPageRouteContract({
  page: PrivacyDocumentPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildSectionDocumentMetadata,
  buildMetadataArgs: ['page_privacyDocument', MOCK_SLUG],
});

describe(`<${PrivacyDocumentPage.name}/>`, () => {
  it('renders the privacy document with the resolved slug', async () => {
    await setup();

    const page = screen.getByTestId('section-document-page');

    expect(page).toHaveTextContent(`page_privacyDocument:${MOCK_SLUG}`);
  });
});
