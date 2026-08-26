import { render, screen } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';

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

  it('renders every icon admin references without throwing', () => {
    const used = [
      ICONS.CHEVRON_RIGHT,
      ICONS.COMMENT,
      ICONS.GLOBE,
      ICONS.GRID,
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
      expect(() => render(<Icon name={name} />)).not.toThrow();
    }
  });
});
