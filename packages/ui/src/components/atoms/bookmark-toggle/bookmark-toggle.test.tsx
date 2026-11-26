import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { BookmarkToggle } from './bookmark-toggle';

faker.seed(123);

const MOCK_LABEL = faker.lorem.word();
const MOCK_ARIA_LABEL = faker.lorem.words(2);

const setup = customRender(BookmarkToggle, {
  isBookmarked: false,
  onToggle: vi.fn(),
  label: MOCK_LABEL,
  ariaLabel: MOCK_ARIA_LABEL,
});

describe(`<${BookmarkToggle.name}/>`, () => {
  let user: UserEvent;
  let onToggle: Mock<() => void>;

  beforeEach(() => {
    user = userEvent.setup();
    onToggle = vi.fn();
  });

  describe('with the default props', () => {
    let button: HTMLElement;

    beforeEach(() => {
      setup({ onToggle });
      button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    });

    it('renders a button with the given accessible name', () => {
      expect(button).toBeVisible();
    });

    it('uses the accessible name as the title', () => {
      expect(button).toHaveAttribute('title', MOCK_ARIA_LABEL);
    });

    it('renders the visible label text', () => {
      const label = screen.getByText(MOCK_LABEL);

      expect(label).toBeVisible();
    });

    it('reports a press', async () => {
      await user.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  it.each([true, false])(
    'reflects a bookmarked state of %s',
    (isBookmarked) => {
      setup({ isBookmarked });

      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

      expect(button).toHaveAttribute('aria-pressed', String(isBookmarked));
    },
  );

  describe('when disabled', () => {
    let button: HTMLElement;

    beforeEach(() => {
      setup({ isDisabled: true, onToggle });
      button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    });

    it('is disabled', () => {
      expect(button).toBeDisabled();
    });

    it('ignores a press', async () => {
      await user.click(button);

      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
