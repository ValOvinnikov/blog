import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeToggle } from './theme-toggle';

describe(`<${ThemeToggle.name}/>`, () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    render(<ThemeToggle />);
  });

  it('renders a button', () => {
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows "Switch to dark theme" label in light mode', () => {
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Switch to dark theme'
    );
  });

  it('toggles aria-label after click', async () => {
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(button).toHaveAccessibleName('Switch to light theme');
  });

  it('adds .dark to <html> when toggled to dark', async () => {
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark from <html> when toggled back to light', async () => {
    const button = screen.getByRole('button');
    await userEvent.click(button);
    await userEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists choice to localStorage', async () => {
    await userEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});

describe(`<${ThemeToggle.name}/> — with props`, () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('merges extra className', () => {
    render(<ThemeToggle className="ml-2" />);
    expect(screen.getByRole('button').className).toContain('ml-2');
  });

  it('uses custom darkLabel', () => {
    render(<ThemeToggle darkLabel="Тёмная тема" />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Тёмная тема');
  });

  it('uses custom lightLabel after toggling to dark', async () => {
    render(<ThemeToggle lightLabel="Светлая тема" />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAccessibleName('Светлая тема');
  });
});
