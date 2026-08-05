import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { BookmarkToggle } from './bookmark-toggle';

const setup = customRender(BookmarkToggle, {
  isBookmarked: false,
  onToggle: vi.fn(),
  label: 'save',
  ariaLabel: 'Save post',
});

describe(`<${BookmarkToggle.name}/>`, () => {
  it('renders a button with the given accessible name', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Save post' })).toBeVisible();
  });

  it('sets title to the same accessible name as aria-label', () => {
    setup();
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Save post');
  });

  it('renders the visible label text', () => {
    setup();
    expect(screen.getByText('save')).toBeVisible();
  });

  it('renders the given label when bookmarked', () => {
    setup({ isBookmarked: true, label: 'saved', ariaLabel: 'Remove bookmark' });
    expect(screen.getByText('saved')).toBeVisible();
  });

  it('reflects aria-pressed="false" when not bookmarked', () => {
    setup();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects aria-pressed="true" when bookmarked', () => {
    setup({ isBookmarked: true, label: 'saved', ariaLabel: 'Remove bookmark' });
    const button = screen.getByRole('button', { name: 'Remove bookmark' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    setup({ onToggle });
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('forwards the disabled attribute', () => {
    setup({ disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onToggle when disabled', async () => {
    const onToggle = vi.fn();
    setup({ disabled: true, onToggle });
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
