import { ICONS } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { Icon } from './icon';

describe(Icon, () => {
  it('is decorative by default', () => {
    const { container } = render(<Icon name={ICONS.GRID} />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
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
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });
});
