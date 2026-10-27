import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { Tile } from './tile';

faker.seed(2841);

const MOCK_TITLE = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();

const setup = customRender(Tile, {
  href: adminRoutes.dashboardLook(),
  icon: ICONS.PALETTE,
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
});

describe(`<${Tile.name}/>`, () => {
  it('links to its page with a title and description', () => {
    setup();

    const link = screen.getByRole('link', { name: new RegExp(MOCK_TITLE) });
    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(link).toHaveAttribute('href', adminRoutes.dashboardLook());
    expect(description).toBeVisible();
  });
});
