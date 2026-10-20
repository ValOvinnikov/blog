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
    expect(screen.getByLabelText('Warning')).toBeVisible();
  });

  it('renders a glyph for every icon admin references', () => {
    const used = [
      ICONS.ARROW,
      ICONS.ARROW_UP,
      ICONS.BOOK,
      ICONS.CHECK,
      ICONS.CHECK_SHEET,
      ICONS.CHEVRON_DOWN,
      ICONS.CHEVRON_RIGHT,
      ICONS.CLOCK,
      ICONS.CLOSE,
      ICONS.COMMENT,
      ICONS.EXTERNAL_LINK,
      ICONS.GLOBE,
      ICONS.GRID,
      ICONS.HOUSE,
      ICONS.INFO,
      ICONS.LAYERS,
      ICONS.LOCK,
      ICONS.MAIL,
      ICONS.MENU,
      ICONS.MENU_ROWS,
      ICONS.PALETTE,
      ICONS.PLUS,
      ICONS.POWER,
      ICONS.QUOTE,
      ICONS.ROCKET,
      ICONS.SETTINGS,
      ICONS.SHIELD_CHECK,
      ICONS.USERS,
      ICONS.WARNING,
      ICONS.ZAP,
    ];
    for (const name of used) {
      const { unmount } = render(<Icon name={name} />);
      expect(screen.getByTestId('icon')).toBeVisible();
      unmount();
    }
  });
});
