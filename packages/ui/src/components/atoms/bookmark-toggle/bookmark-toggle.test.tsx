import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { BookmarkToggle } from './bookmark-toggle';

const setup = customRender(BookmarkToggle, {
  isBookmarked: false,
  onToggle: vi.fn(),
  label: 'save',
  ariaLabel: 'Save post',
});

describe(`<${BookmarkToggle.name}/>`, () => {
  let onToggle: Mock<() => void>;

  beforeEach(() => {
    onToggle = vi.fn();
  });

  describe('when not bookmarked', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a button with the given accessible name', () => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeVisible();
    });

    it('sets title to the same accessible name as aria-label', () => {
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Save post');
    });

    it('renders the visible label text', () => {
      expect(screen.getByText('save')).toBeVisible();
    });

    it('reflects aria-pressed="false"', () => {
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('when bookmarked', () => {
    beforeEach(() => {
      setup({
        isBookmarked: true,
        label: 'saved',
        ariaLabel: 'Remove bookmark',
      });
    });

    it('renders the given label', () => {
      expect(screen.getByText('saved')).toBeVisible();
    });

    it('reflects aria-pressed="true"', () => {
      const button = screen.getByRole('button', { name: 'Remove bookmark' });
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('calls onToggle when clicked', async () => {
    setup({ onToggle });
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('forwards the disabled attribute', () => {
    setup({ isDisabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onToggle when disabled', async () => {
    setup({ isDisabled: true, onToggle });
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
