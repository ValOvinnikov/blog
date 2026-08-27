import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';

import { Tile } from './tile';

const render = renderWithIntl;

describe(Tile, () => {
  it('renders a link to the given href with a title and description', () => {
    render(
      <Tile
        href="/dashboard/look"
        icon={ICONS.PALETTE}
        title="Look"
        description="Colours, fonts, logo, density"
      />,
    );

    const link = screen.getByRole('link', { name: /Look/ });
    expect(link).toHaveAttribute('href', '/dashboard/look');
    expect(screen.getByText('Colours, fonts, logo, density')).toBeVisible();
  });
});
