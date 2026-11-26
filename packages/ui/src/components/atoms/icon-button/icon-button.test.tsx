import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

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

  it('reports a press', async () => {
    const onClick = vi.fn();
    setup({ onClick });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    setup({ isDisabled: true });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

    expect(button).toBeDisabled();
  });

  describe('when disabled but focusable', () => {
    let onClick: Mock<() => void>;
    let button: HTMLElement;

    beforeEach(() => {
      onClick = vi.fn();
      setup({ isDisabled: true, isFocusableWhenDisabled: true, onClick });
      button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    });

    it('is aria-disabled and stays focusable', async () => {
      await user.tab();

      expect(button).toBeEnabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveFocus();
    });

    it('ignores a press', async () => {
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
