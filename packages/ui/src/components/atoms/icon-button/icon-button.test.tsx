import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconButton } from './icon-button';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_ICON_TEXT = faker.lorem.word();

const setup = customRender(IconButton, {
  ariaLabel: MOCK_ARIA_LABEL,
  children: <span>{MOCK_ICON_TEXT}</span>,
});

describe(`<${IconButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a button with the given accessible name', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

    expect(button).toBeVisible();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when isDisabled is set', () => {
    setup({ isDisabled: true });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

    expect(button).toBeDisabled();
  });

  describe('when disabled but focusable', () => {
    let onClick: () => void;

    beforeEach(() => {
      onClick = vi.fn();
      setup({ isDisabled: true, isFocusableWhenDisabled: true, onClick });
    });

    it('is aria-disabled and stays focusable', async () => {
      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
      await user.tab();

      expect(button).toBeEnabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveFocus();
    });

    it('does not call onClick when clicked', async () => {
      const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
