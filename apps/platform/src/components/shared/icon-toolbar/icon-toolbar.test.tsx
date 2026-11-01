import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { IconSoloToggle } from '@platform/components/shared/icon-solo-toggle';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconToolbar } from './icon-toolbar';

faker.seed(6382);

const RIGHT = '{ArrowRight}';
const LEFT = '{ArrowLeft}';
const ARIA_PRESSED = 'aria-pressed';
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

const option = (
  value: string,
  icon: TRegisteredIconName,
  ariaLabel: string,
) => ({
  value,
  icon,
  ariaLabel,
  tooltip: faker.lorem.words(3),
});

const MOCK_DEVICE_GROUP = {
  ariaLabel: MOCK_DEVICE_LABEL,
  value: MOCK_TABLET_LABEL,
  onChange: vi.fn(),
  options: [
    option(MOCK_PHONE_LABEL, ICONS.PHONE, MOCK_PHONE_LABEL),
    option(MOCK_TABLET_LABEL, ICONS.TABLET, MOCK_TABLET_LABEL),
    {
      ...option(MOCK_DESKTOP_LABEL, ICONS.MONITOR, MOCK_DESKTOP_LABEL),
      tooltip: MOCK_DESKTOP_TOOLTIP,
    },
  ],
};

const MOCK_SCHEME_GROUP = {
  ariaLabel: MOCK_SCHEME_LABEL,
  value: MOCK_LIGHT_LABEL,
  onChange: vi.fn(),
  options: [
    option(MOCK_LIGHT_LABEL, ICONS.SUN, MOCK_LIGHT_LABEL),
    option(MOCK_DARK_LABEL, ICONS.MOON, MOCK_DARK_LABEL),
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

    await user.keyboard(RIGHT);
    expect(getButton(MOCK_DESKTOP_LABEL)).toHaveFocus();

    await user.keyboard(RIGHT);
    expect(getButton(MOCK_LIGHT_LABEL)).toHaveFocus();

    await user.keyboard(RIGHT.repeat(2));
    expect(getButton(MOCK_SOLO_LABEL)).toHaveFocus();

    await user.keyboard(LEFT.repeat(3));
    expect(getButton(MOCK_DESKTOP_LABEL)).toHaveFocus();
  });

  it('stops at the last button without wrapping', async () => {
    setup();
    await user.tab();

    await user.keyboard(`{End}${RIGHT}`);

    expect(getButton(MOCK_END_LABEL)).toHaveFocus();
  });

  it('stops at the first button without wrapping', async () => {
    setup();
    await user.tab();

    await user.keyboard(`{Home}${LEFT}`);

    expect(getButton(MOCK_PHONE_LABEL)).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    setup();
    await user.tab();

    await user.keyboard('{End}');
    expect(getButton(MOCK_END_LABEL)).toHaveFocus();

    await user.keyboard('{Home}');
    expect(getButton(MOCK_PHONE_LABEL)).toHaveFocus();
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
    await user.keyboard(RIGHT.repeat(3));

    await user.tab();
    await user.tab({ shift: true });

    expect(getButton(MOCK_DARK_LABEL)).toHaveFocus();
  });

  it('resets to the first group pressed button when the groups change', async () => {
    const { rerender } = setup();
    await user.tab();
    await user.keyboard('{End}');

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

  it('opens a tooltip unlike the aria-label on keyboard focus', async () => {
    setup();
    await user.tab();

    await user.keyboard(RIGHT);
    const tooltip = await screen.findByText(MOCK_DESKTOP_TOOLTIP);
    const desktopButton = getButton(MOCK_DESKTOP_LABEL);

    expect(tooltip).toBeVisible();
    expect(desktopButton).toHaveAccessibleName(MOCK_DESKTOP_LABEL);
  });
});
