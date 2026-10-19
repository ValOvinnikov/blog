import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { ThemeToggle } from './theme-toggle';

const setup = customRender(ThemeToggle, {
  isDark: false,
  onToggle: vi.fn(),
});

describe(`<${ThemeToggle.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a button', () => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    it('shows "Switch to dark theme" label when isDark is false', () => {
      expect(screen.getByRole('button')).toHaveAccessibleName(
        'Switch to dark theme',
      );
    });
  });

  it('shows "Switch to light theme" label when isDark is true', () => {
    setup({ isDark: true });
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Switch to light theme',
    );
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    setup({ onToggle });
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the accessible name after re-rendering with a new isDark value', () => {
    const { rerender } = setup();
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Switch to dark theme',
    );

    rerender(<ThemeToggle isDark={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Switch to light theme',
    );
  });

  it('renders only the moon icon when isDark is false', () => {
    setup();
    expect(screen.getByTestId('theme-toggle-moon')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-toggle-sun')).not.toBeInTheDocument();
  });

  it('renders only the sun icon when isDark is true', () => {
    setup({ isDark: true });
    expect(screen.getByTestId('theme-toggle-sun')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-toggle-moon')).not.toBeInTheDocument();
  });

  it('renders both icons when the theme class picks the icon', () => {
    setup({ isIconFromThemeClass: true });
    expect(screen.getByTestId('theme-toggle-sun')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle-moon')).toBeInTheDocument();
  });
});

describe(`<${ThemeToggle.name}/> — with custom labels`, () => {
  it('uses custom darkLabel', () => {
    setup({ darkLabel: 'Тёмная тема' });
    expect(screen.getByRole('button')).toHaveAccessibleName('Тёмная тема');
  });

  it('uses custom lightLabel when isDark is true', () => {
    setup({ isDark: true, lightLabel: 'Светлая тема' });
    expect(screen.getByRole('button')).toHaveAccessibleName('Светлая тема');
  });
});
