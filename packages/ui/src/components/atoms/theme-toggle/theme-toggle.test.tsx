import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ThemeToggle } from './theme-toggle';

faker.seed(123);

const MOCK_DARK_LABEL = faker.lorem.words(3);
const MOCK_LIGHT_LABEL = faker.lorem.words(3);
const SUN_ICON_TEST_ID = 'theme-toggle-sun';
const MOON_ICON_TEST_ID = 'theme-toggle-moon';

const setup = customRender(ThemeToggle, {
  isDark: false,
  onToggle: vi.fn(),
  darkLabel: MOCK_DARK_LABEL,
  lightLabel: MOCK_LIGHT_LABEL,
});

describe(`<${ThemeToggle.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('while the theme is light', () => {
    let onToggle: Mock<() => void>;
    let button: HTMLElement;

    beforeEach(() => {
      onToggle = vi.fn();
      setup({ isDark: false, onToggle });
      button = screen.getByRole('button', { name: MOCK_DARK_LABEL });
    });

    it('offers the dark label', () => {
      expect(button).toBeVisible();
    });

    it('reports a press', async () => {
      await user.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders only the moon icon', () => {
      const moonIcon = screen.getByTestId(MOON_ICON_TEST_ID);
      const sunIcon = screen.queryByTestId(SUN_ICON_TEST_ID);

      expect(moonIcon).toBeVisible();
      expect(sunIcon).not.toBeInTheDocument();
    });
  });

  describe('while the theme is dark', () => {
    beforeEach(() => {
      setup({ isDark: true });
    });

    it('offers the light label', () => {
      const button = screen.getByRole('button', { name: MOCK_LIGHT_LABEL });

      expect(button).toBeVisible();
    });

    it('renders only the sun icon', () => {
      const sunIcon = screen.getByTestId(SUN_ICON_TEST_ID);
      const moonIcon = screen.queryByTestId(MOON_ICON_TEST_ID);

      expect(sunIcon).toBeVisible();
      expect(moonIcon).not.toBeInTheDocument();
    });
  });

  it('renders both icons when the theme class picks the icon', () => {
    setup({ isIconFromThemeClass: true });

    const sunIcon = screen.getByTestId(SUN_ICON_TEST_ID);
    const moonIcon = screen.getByTestId(MOON_ICON_TEST_ID);

    expect(sunIcon).toBeVisible();
    expect(moonIcon).toBeVisible();
  });
});
