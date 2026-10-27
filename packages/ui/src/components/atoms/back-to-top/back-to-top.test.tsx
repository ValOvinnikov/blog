import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { BackToTop } from './back-to-top';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(3);

const setup = customRender(BackToTop, {
  isVisible: true,
  onClick: vi.fn(),
  ariaLabel: MOCK_ARIA_LABEL,
});

describe(`<${BackToTop.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('is a visible, interactive button with the given accessible name', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });

    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('inert');
  });

  it('is inert when isVisible is false', () => {
    setup({ isVisible: false });

    const button = screen.getByRole('button', {
      hidden: true,
      name: MOCK_ARIA_LABEL,
    });

    expect(button).toHaveAttribute('inert');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });

    const button = screen.getByRole('button', { name: MOCK_ARIA_LABEL });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
