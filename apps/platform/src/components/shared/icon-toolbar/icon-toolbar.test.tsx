import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { IconSoloToggle } from '@platform/components/shared/icon-solo-toggle';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockIconToggleOption } from '@platform/testing/icon-toggle-group/fixtures';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconToolbar } from './icon-toolbar';

faker.seed(6382);

const MOCK_TOOLBAR_LABEL = faker.lorem.words(2);
const MOCK_DEVICE_LABEL = faker.lorem.word();
const MOCK_SCHEME_LABEL = faker.lorem.word();
const MOCK_PHONE_LABEL = faker.lorem.words(2);
const MOCK_TABLET_LABEL = faker.lorem.words(2);
const MOCK_DESKTOP_LABEL = faker.lorem.words(2);
const MOCK_LIGHT_LABEL = faker.lorem.words(2);
const MOCK_DARK_LABEL = faker.lorem.words(2);
const MOCK_SOLO_LABEL = faker.lorem.words(2);
const MOCK_END_LABEL = faker.lorem.words(2);
const MOCK_END_TOOLTIP = faker.lorem.words(3);
const MOCK_DESKTOP_TOOLTIP = faker.lorem.words(3);

const MOCK_DEVICE_GROUP = {
  ariaLabel: MOCK_DEVICE_LABEL,
  value: MOCK_TABLET_LABEL,
  onChange: vi.fn(),
  options: [
    mockIconToggleOption({
      value: MOCK_PHONE_LABEL,
      icon: ICONS.PHONE,
      ariaLabel: MOCK_PHONE_LABEL,
    }),
    mockIconToggleOption({
      value: MOCK_TABLET_LABEL,
      icon: ICONS.TABLET,
      ariaLabel: MOCK_TABLET_LABEL,
    }),
    mockIconToggleOption({
      value: MOCK_DESKTOP_LABEL,
      icon: ICONS.MONITOR,
      ariaLabel: MOCK_DESKTOP_LABEL,
      tooltip: MOCK_DESKTOP_TOOLTIP,
    }),
  ],
};

const MOCK_SCHEME_GROUP = {
  ariaLabel: MOCK_SCHEME_LABEL,
  value: MOCK_LIGHT_LABEL,
  onChange: vi.fn(),
  options: [
    mockIconToggleOption({
      value: MOCK_LIGHT_LABEL,
      icon: ICONS.SUN,
      ariaLabel: MOCK_LIGHT_LABEL,
    }),
    mockIconToggleOption({
      value: MOCK_DARK_LABEL,
      icon: ICONS.MOON,
      ariaLabel: MOCK_DARK_LABEL,
    }),
  ],
};

const MOCK_END_SLOT = (
  <IconSoloButton
    ariaLabel={MOCK_END_LABEL}
    tooltip={MOCK_END_TOOLTIP}
    icon={ICONS.SETTINGS}
    onClick={vi.fn()}
    isTooltipEndAligned={true}
  />
);

const setup = customRender(IconToolbar, {
  ariaLabel: MOCK_TOOLBAR_LABEL,
  groups: [MOCK_DEVICE_GROUP, MOCK_SCHEME_GROUP],
  children: (
    <>
      <IconSoloToggle
        ariaLabel={MOCK_SOLO_LABEL}
        tooltip={faker.lorem.words(3)}
        icon={ICONS.GRID}
        isPressed={false}
        onPressedChange={vi.fn()}
      />
      {MOCK_END_SLOT}
    </>
  ),
});

const getButton = (name: string) => screen.getByRole('button', { name });

describe(`<${IconToolbar.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a named toolbar with a named group per entry', () => {
    setup();

    const toolbar = screen.getByRole('toolbar', { name: MOCK_TOOLBAR_LABEL });
    const deviceGroup = screen.getByRole('group', { name: MOCK_DEVICE_LABEL });
    const schemeGroup = screen.getByRole('group', { name: MOCK_SCHEME_LABEL });

    expect(toolbar).toBeVisible();
    expect(deviceGroup).toBeVisible();
    expect(schemeGroup).toBeVisible();
  });

  it('renders the end slot children', () => {
    setup();

    const endButton = getButton(MOCK_END_LABEL);

    expect(endButton).toBeVisible();
  });

  it('presses exactly one button per group', () => {
    setup();

    expect(getButton(MOCK_PHONE_LABEL)).not.toBePressed();
    expect(getButton(MOCK_TABLET_LABEL)).toBePressed();
    expect(getButton(MOCK_DESKTOP_LABEL)).not.toBePressed();
    expect(getButton(MOCK_LIGHT_LABEL)).toBePressed();
    expect(getButton(MOCK_DARK_LABEL)).not.toBePressed();
  });

  it('keeps a solo button free of a pressed state', () => {
    setup();

    const endButton = getButton(MOCK_END_LABEL);

    expect(endButton).not.toHaveAttribute(ARIA_PRESSED);
  });

  it('lands the first Tab on the first group pressed button', async () => {
    setup();

    await user.tab();
    const tabletButton = getButton(MOCK_TABLET_LABEL);

    expect(tabletButton).toHaveFocus();
  });

  it('moves with Arrow keys across groups and solos', async () => {
    setup();
    await user.tab();

    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
    expect(getButton(MOCK_DESKTOP_LABEL)).toHaveFocus();

    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
    expect(getButton(MOCK_LIGHT_LABEL)).toHaveFocus();

    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT.repeat(2));
    expect(getButton(MOCK_SOLO_LABEL)).toHaveFocus();

    await user.keyboard(USER_EVENT_KEY.ARROW_LEFT.repeat(3));
    expect(getButton(MOCK_DESKTOP_LABEL)).toHaveFocus();
  });

  it('stops at the last button without wrapping', async () => {
    setup();
    await user.tab();

    await user.keyboard(`${USER_EVENT_KEY.END}${USER_EVENT_KEY.ARROW_RIGHT}`);

    expect(getButton(MOCK_END_LABEL)).toHaveFocus();
  });

  it('stops at the first button without wrapping', async () => {
    setup();
    await user.tab();

    await user.keyboard(`${USER_EVENT_KEY.HOME}${USER_EVENT_KEY.ARROW_LEFT}`);

    expect(getButton(MOCK_PHONE_LABEL)).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    setup();
    await user.tab();

    await user.keyboard(USER_EVENT_KEY.END);
    expect(getButton(MOCK_END_LABEL)).toHaveFocus();

    await user.keyboard(USER_EVENT_KEY.HOME);
    expect(getButton(MOCK_PHONE_LABEL)).toHaveFocus();
  });

  it('keeps Home and End inside a text input in the end slot', async () => {
    setup({ children: <input aria-label={MOCK_END_LABEL} /> });
    const input = screen.getByRole('textbox', { name: MOCK_END_LABEL });
    await user.click(input);

    await user.keyboard(`${USER_EVENT_KEY.HOME}${USER_EVENT_KEY.END}`);

    expect(input).toHaveFocus();
  });

  it('leaves the toolbar on Tab', async () => {
    setup();
    await user.tab();

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('returns to the last focused button on Tab back in', async () => {
    setup();
    await user.tab();
    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT.repeat(3));

    await user.tab();
    await user.tab({ shift: true });

    expect(getButton(MOCK_DARK_LABEL)).toHaveFocus();
  });

  it('resets to the first group pressed button when the groups change', async () => {
    const { rerender } = setup();
    await user.tab();
    await user.keyboard(USER_EVENT_KEY.END);

    rerender(
      <IconToolbar
        ariaLabel={MOCK_TOOLBAR_LABEL}
        groups={[MOCK_SCHEME_GROUP, MOCK_DEVICE_GROUP]}
      />,
    );
    await user.tab();
    await user.tab({ shift: true });
    await user.tab();

    expect(getButton(MOCK_LIGHT_LABEL)).toHaveFocus();
  });
});
