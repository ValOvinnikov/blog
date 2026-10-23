import { ICONS } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { Tile } from './tile';

const render = renderWithIntl;

const DESCRIPTION = 'Colours, fonts, logo, density';

describe(Tile, () => {
  it('renders a link to the given href with a title and description', () => {
    render(
      <Tile
        href={adminRoutes.dashboardLook()}
        icon={ICONS.PALETTE}
        title="Look"
        description={DESCRIPTION}
      />,
    );

    const link = screen.getByRole('link', { name: /Look/ });
    const description = screen.getByText(DESCRIPTION);

    expect(link).toHaveAttribute('href', adminRoutes.dashboardLook());
    expect(description).toBeVisible();
  });
});
