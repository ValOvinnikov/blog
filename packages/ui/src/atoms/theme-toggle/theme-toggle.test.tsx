import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { ThemeToggle } from './theme-toggle';

const setup = customRender(ThemeToggle, {
  isDark: false,
  onToggle: vi.fn(),
});

describe(`<${ThemeToggle.name}/>`, () => {
  it('renders a button', () => {
    setup();
    expect(screen.getByRole('button')).toBeVisible();
  });

  it('shows "Switch to dark theme" label when isDark is false', () => {
    setup();
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Switch to dark theme',
    );
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

  it('renders the placeholder and no icon when mounted is false', () => {
    setup({ mounted: false });
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
    expect(
      button.querySelector('span[aria-hidden="true"]'),
    ).toBeInTheDocument();
  });

  it('renders the icon when mounted is true', () => {
    setup({ mounted: true });
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
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
