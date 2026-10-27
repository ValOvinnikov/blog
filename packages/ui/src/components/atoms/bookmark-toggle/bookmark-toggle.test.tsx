import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

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

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a button with the given accessible name', () => {
      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

      expect(button).toBeVisible();
    });

    it('uses the accessible name as the title', () => {
      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

      expect(button).toHaveAttribute('title', MOCK_ARIA_LABEL);
    });

    it('renders the visible label text', () => {
      const label = screen.getByText(MOCK_LABEL);

      expect(label).toBeVisible();
    });
  });

  it.each([true, false])(
    'reflects aria-pressed when isBookmarked is %s',
    (isBookmarked) => {
      setup({ isBookmarked });

      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

      expect(button).toHaveAttribute('aria-pressed', String(isBookmarked));
    },
  );

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    setup({ onToggle });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isDisabled is set', () => {
    setup({ isDisabled: true });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

    expect(button).toBeDisabled();
  });

  it('does not call onToggle when disabled', async () => {
    const onToggle = vi.fn();
    setup({ isDisabled: true, onToggle });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    await user.click(button);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
