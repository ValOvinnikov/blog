import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { mockIconToggleOption } from '@platform/testing/icon-toggle-group/fixtures';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { IconToggleGroup } from './icon-toggle-group';

faker.seed(6382);

const MOCK_GROUP_LABEL = faker.lorem.word();
const MOCK_FIRST_VALUE = faker.string.uuid();
const MOCK_SECOND_VALUE = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_FIRST_TOOLTIP = faker.lorem.words(3);

const MOCK_OPTIONS = [
  mockIconToggleOption({
    value: MOCK_FIRST_VALUE,
    icon: ICONS.PHONE,
    ariaLabel: MOCK_FIRST_LABEL,
    tooltip: MOCK_FIRST_TOOLTIP,
  }),
  mockIconToggleOption({
    value: MOCK_SECOND_VALUE,
    icon: ICONS.TABLET,
    ariaLabel: MOCK_SECOND_LABEL,
  }),
];

const setup = customRender(IconToggleGroup<string>, {
  ariaLabel: MOCK_GROUP_LABEL,
  options: MOCK_OPTIONS,
  value: MOCK_FIRST_VALUE,
  onChange: vi.fn(),
});

const StatefulGroup = () => {
  const [value, setValue] = useState(MOCK_FIRST_VALUE);

  return (
    <IconToggleGroup
      ariaLabel={MOCK_GROUP_LABEL}
      options={MOCK_OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
};

describe(`<${IconToggleGroup.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('is named by its aria-label and names each button by its own', () => {
    setup();

    const group = screen.getByRole('group', { name: MOCK_GROUP_LABEL });
    const firstButton = screen.getByRole('button', { name: MOCK_FIRST_LABEL });

    expect(group).toBeVisible();
    expect(firstButton).toBeVisible();
  });

  it('presses only the button for the current value', () => {
    setup();

    const firstButton = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    const secondButton = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });

    expect(firstButton).toBePressed();
    expect(secondButton).not.toBePressed();
  });

  it('reports the clicked button', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const secondButton = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });
    await user.click(secondButton);

    expect(onChange).toHaveBeenCalledWith(MOCK_SECOND_VALUE);
  });

  it('leaves the pressed button pressed and reports nothing when clicked', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const firstButton = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    await user.click(firstButton);

    expect(firstButton).toBePressed();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps exactly one button pressed after choosing another', async () => {
    renderWithIntl(<StatefulGroup />);

    const firstButton = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    const secondButton = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });
    await user.click(secondButton);

    expect(firstButton).not.toBePressed();
    expect(secondButton).toBePressed();
  });

  it.each([USER_EVENT_KEY.ENTER, USER_EVENT_KEY.SPACE])(
    'presses with %j and keeps focus',
    async (key) => {
      renderWithIntl(<StatefulGroup />);

      const secondButton = screen.getByRole('button', {
        name: MOCK_SECOND_LABEL,
      });
      await user.tab();
      await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
      await user.keyboard(key);

      expect(secondButton).toBePressed();
      expect(secondButton).toHaveFocus();
    },
  );

  it('opens a tooltip unlike the aria-label on keyboard focus, keeping the name', async () => {
    setup();

    await user.tab();
    const tooltip = await screen.findByText(MOCK_FIRST_TOOLTIP);
    const firstButton = screen.getByRole('button', { name: MOCK_FIRST_LABEL });

    expect(tooltip).toBeVisible();
    expect(firstButton).toHaveAccessibleName(MOCK_FIRST_LABEL);
  });
});
