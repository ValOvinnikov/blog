import { BRAND_VARIANT, DISPLAY_MODE, GRID_COLUMNS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostRelatedModuleView } from './post-related-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_DATA_TEST_ID = faker.lorem.slug();

const mockItems = (count: number) =>
  Array.from({ length: count }, () =>
    mockPostListItem({ id: faker.string.uuid() }),
  );

const setup = customRender(PostRelatedModuleView, {
  section: { brandVariant: BRAND_VARIANT.PRIMARY },
  headingBlock: mockHeadingBlock(),
  items: mockItems(2),
  contentAlignment: undefined,
  titleId: faker.lorem.slug(),
  dataTestId: MOCK_DATA_TEST_ID,
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostRelatedModuleView.name}/>`, () => {
  it('lays the grid out in the stored column count over the post count', () => {
    setup({ columns: GRID_COLUMNS.FOUR, items: mockItems(2) });

    const grid = screen.getByTestId(`${MOCK_DATA_TEST_ID}-grid-4`);

    expect(grid).toBeVisible();
  });

  it('falls back to columns that fit the post count on Auto', () => {
    setup({ columns: undefined, items: mockItems(5) });

    const grid = screen.getByTestId(`${MOCK_DATA_TEST_ID}-grid-3`);

    expect(grid).toBeVisible();
  });
});
