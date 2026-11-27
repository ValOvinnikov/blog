import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { customRender, screen } from '@platform/testing/custom-render';
import { ICONS } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconSoloButton } from './icon-solo-button';

faker.seed(6382);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_TOOLTIP = faker.lorem.words(3);

const setup = customRender(IconSoloButton, {
  ariaLabel: MOCK_LABEL,
  tooltip: MOCK_TOOLTIP,
  icon: ICONS.SUN,
  onClick: vi.fn(),
});

describe(`<${IconSoloButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('has no pressed state', () => {
      const button = screen.getByRole('button', { name: MOCK_LABEL });

      expect(button).not.toHaveAttribute(ARIA_ATTRIBUTE.PRESSED);
    });

    describe('on keyboard focus', () => {
      beforeEach(async () => {
        await user.tab();
      });

      it('is its own Tab stop outside a toolbar', () => {
        const button = screen.getByRole('button', { name: MOCK_LABEL });

        expect(button).toHaveFocus();
      });

      it('opens its tooltip at once, keeping the name', async () => {
        const tooltip = await screen.findByText(MOCK_TOOLTIP);
        const button = screen.getByRole('button', { name: MOCK_LABEL });

        expect(tooltip).toBeVisible();
        expect(button).toHaveAccessibleName(MOCK_LABEL);
      });
    });
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
