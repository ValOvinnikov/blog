import { buildSectionIndexMetadata } from '@web/metadata/section-index-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import PrivacyIndexRoute, { generateMetadata, revalidate } from './page';

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

const setup = customRenderAsync(PrivacyIndexRoute, { params });

testPageRouteContract({
  page: PrivacyIndexRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildSectionIndexMetadata,
  buildMetadataArgs: ['page_privacyIndex'],
});

describe(`<${PrivacyIndexRoute.name}/>`, () => {
  it('renders the privacy hub', async () => {
    await setup();

    const page = screen.getByTestId('section-index-page');

    expect(page).toHaveTextContent('page_privacyIndex');
  });
});
