import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_SECTION_PAGE_PATH,
  MOCK_SECTION_PAGE_SUMMARY,
  MOCK_SECTION_PAGE_TITLE,
  MOCK_SECTION_PAGES_HEADING,
  mockSectionPageCard,
  mockSectionPagesModule,
} from '@web/testing/modules/section-pages/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(41);

const MOCK_OTHER_PAGE_TITLE = faker.lorem.words(2);
const MOCK_OTHER_PAGE_PATH = faker.lorem.slug();
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();

const setup = customRender(SectionPagesModuleView, {
  ...mockSectionPagesModule(),
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${SectionPagesModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const section = screen.getByRole('region', {
        name: MOCK_SECTION_PAGES_HEADING,
      });
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_SECTION_PAGES_HEADING,
      });

      expect(section).toBeVisible();
      expect(heading).toBeVisible();
    });

    it('renders each card title one level below the module heading', () => {
      const cardTitle = screen.getByRole('heading', {
        level: 3,
        name: MOCK_SECTION_PAGE_TITLE,
      });

      expect(cardTitle).toBeVisible();
    });

    it('renders the section page summary', () => {
      const card = screen.getByRole('article');
      const summary = within(card).getByText(MOCK_SECTION_PAGE_SUMMARY);

      expect(summary).toBeVisible();
    });

    it('renders no media region when the section page has no image', () => {
      const media = screen.queryByTestId('section-page-card-media');

      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders a card per section page in order, linking to its full path', () => {
    setup({
      pages: [
        mockSectionPageCard({
          id: faker.string.uuid(),
          title: MOCK_OTHER_PAGE_TITLE,
          path: MOCK_OTHER_PAGE_PATH,
        }),
        mockSectionPageCard(),
      ],
    });

    const links = screen.getAllByRole('link');
    const [firstLink, secondLink] = links;

    expect(links.map((link) => link.textContent)).toEqual([
      MOCK_OTHER_PAGE_TITLE,
      MOCK_SECTION_PAGE_TITLE,
    ]);
    expect(firstLink).toHaveAttribute('href', `/${MOCK_OTHER_PAGE_PATH}`);
    expect(secondLink).toHaveAttribute('href', `/${MOCK_SECTION_PAGE_PATH}`);
  });

  it('renders card titles as the top-level heading when the module has no heading', () => {
    setup({ headingBlock: undefined });

    const cardTitle = screen.getByRole('heading', {
      level: 2,
      name: MOCK_SECTION_PAGE_TITLE,
    });
    const headings = screen.getAllByRole('heading');

    expect(cardTitle).toBeVisible();
    expect(headings).toHaveLength(1);
  });

  it('renders the section page image when it has one', () => {
    const image = mockSanityImage();
    setup({ pages: [mockSectionPageCard({ image })] });

    const renderedImage = screen.getByRole('img', { name: image.alt });

    expect(renderedImage).toBeVisible();
  });
});
