import { faker } from '@faker-js/faker';
import { GRID_COLUMNS } from '@shinefold/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_SECTION_PAGE_PATH,
  MOCK_SECTION_PAGE_SUMMARY,
  MOCK_SECTION_PAGE_TITLE,
  MOCK_SECTION_PAGES_HEADING,
  mockSectionPageCard,
  mockSectionPagesContent,
} from '@web/testing/modules/section-pages/fixtures';
import { mockItemsWithIds } from '@web/testing/shared/items/fixtures';
import {
  MOCK_PRIMARY_SECTION,
  MOCK_RADIUS_SCOPE_CASES,
  MOCK_SCOPED_RADIUS_TOKEN,
} from '@web/testing/shared/section-appearance/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

faker.seed(41);

const MOCK_OTHER_PAGE_TITLE = faker.lorem.words(2);
const MOCK_OTHER_PAGE_PATH = faker.lorem.slug();
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();

const setup = customRender(SectionPagesModuleView, {
  ...mockSectionPagesContent(),
  section: MOCK_PRIMARY_SECTION,
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

  it.each(MOCK_RADIUS_SCOPE_CASES)(
    'scopes the radius token to its section $title an override',
    ({ section, scoped }) => {
      setup({ section });

      const region = screen.getByRole('region', {
        name: MOCK_SECTION_PAGES_HEADING,
      });

      expect(region.style.getPropertyValue(MOCK_SCOPED_RADIUS_TOKEN)).toBe(
        scoped,
      );
    },
  );

  it.each([
    {
      title: 'in the stored column count for one child',
      columns: GRID_COLUMNS.THREE,
      pageCount: 1,
      expected: 3,
    },
    {
      title: 'in the stored column count for two children',
      columns: GRID_COLUMNS.THREE,
      pageCount: 2,
      expected: 3,
    },
    {
      title: 'in columns that fit the child count on Site default',
      columns: undefined,
      pageCount: 2,
      expected: 2,
    },
  ])('lays the grid out $title', ({ columns, pageCount, expected }) => {
    setup({ columns, pages: mockItemsWithIds(pageCount, mockSectionPageCard) });

    const grid = screen.getByTestId(`${MOCK_DATA_TEST_ID}-grid-${expected}`);

    expect(grid).toBeVisible();
  });
});
