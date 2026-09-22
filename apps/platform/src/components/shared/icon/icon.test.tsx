import { ICONS } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { Icon } from './icon';

describe(Icon, () => {
  it('is decorative by default', () => {
    render(<Icon name={ICONS.GRID} />);
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible name when one is given', () => {
    render(<Icon name={ICONS.WARNING} ariaLabel="Warning" />);
    expect(screen.getByLabelText('Warning')).toBeInTheDocument();
  });

  it('renders a glyph for every icon admin references', () => {
    const used = [
      ICONS.CHECK_SHEET,
      ICONS.CHEVRON_RIGHT,
      ICONS.COMMENT,
      ICONS.GLOBE,
      ICONS.GRID,
      ICONS.HOUSE,
      ICONS.MAIL,
      ICONS.MENU,
      ICONS.MENU_ROWS,
      ICONS.PALETTE,
      ICONS.PLUS,
      ICONS.QUOTE,
      ICONS.SETTINGS,
      ICONS.USERS,
      ICONS.WARNING,
    ];
    for (const name of used) {
      const { unmount } = render(<Icon name={name} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      unmount();
    }
  });
});
