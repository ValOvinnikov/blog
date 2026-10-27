import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

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

  it('offers the dark label while the theme is light', () => {
    setup({ isDark: false });

    const button = screen.getByRole('button', { name: MOCK_DARK_LABEL });

    expect(button).toBeVisible();
  });

  it('offers the light label while the theme is dark', () => {
    setup({ isDark: true });

    const button = screen.getByRole('button', { name: MOCK_LIGHT_LABEL });

    expect(button).toBeVisible();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    setup({ onToggle });

    const button = screen.getByRole('button', { name: MOCK_DARK_LABEL });
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders only the moon icon while the theme is light', () => {
    setup({ isDark: false });

    const moonIcon = screen.getByTestId(MOON_ICON_TEST_ID);
    const sunIcon = screen.queryByTestId(SUN_ICON_TEST_ID);

    expect(moonIcon).toBeVisible();
    expect(sunIcon).not.toBeInTheDocument();
  });

  it('renders only the sun icon while the theme is dark', () => {
    setup({ isDark: true });

    const sunIcon = screen.getByTestId(SUN_ICON_TEST_ID);
    const moonIcon = screen.queryByTestId(MOON_ICON_TEST_ID);

    expect(sunIcon).toBeVisible();
    expect(moonIcon).not.toBeInTheDocument();
  });

  it('renders both icons when the theme class picks the icon', () => {
    setup({ isIconFromThemeClass: true });

    const sunIcon = screen.getByTestId(SUN_ICON_TEST_ID);
    const moonIcon = screen.getByTestId(MOON_ICON_TEST_ID);

    expect(sunIcon).toBeVisible();
    expect(moonIcon).toBeVisible();
  });
});
