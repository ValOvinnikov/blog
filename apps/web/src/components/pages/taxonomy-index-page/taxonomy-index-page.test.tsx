import { faker } from '@faker-js/faker';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import { testPageHeading } from '@web/testing/pages/page-heading-contract/page-heading-contract';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_BREADCRUMBS_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

import { TaxonomyIndexPage } from './taxonomy-index-page';

faker.seed(5503);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_INDEX_PAGE = mockIndexPage({
  headingBlock: mockHeadingBlock({
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  }),
});

const setup = customRenderServerAsync(TaxonomyIndexPage, {
  pageData: MOCK_INDEX_PAGE,
  breadcrumbs: <nav data-testid={MOCK_BREADCRUMBS_STUB_TEST_ID} />,
});

describe(`<${TaxonomyIndexPage.name}/>`, () => {
  it('renders the given breadcrumbs outside main', async () => {
    await setup();

    const breadcrumbs = screen.getByTestId(MOCK_BREADCRUMBS_STUB_TEST_ID);
    const main = screen.getByRole('main');

    expect(main).not.toContainElement(breadcrumbs);
  });

  testPageHeading({
    renderPage: () => setup(),
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  });
});
