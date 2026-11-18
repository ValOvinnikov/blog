import {
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  ICONS,
  SIZE,
} from '@shinefold/config';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import {
  BRAND_BAND_LABELS,
  BrandBand,
} from '@shinefold/ui/testing/brand-bands';
import { ButtonShapes } from '@shinefold/ui/testing/button-shapes';
import { HeaderControlShapes } from '@shinefold/ui/testing/header-control-shapes';
import { objectKeys } from '@shinefold/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { within } from 'storybook/test';

import { IconButton } from './icon-button';
import { iconButtonVariants } from './icon-button-variants';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(iconButtonVariants.variants.variant),
    },
  },
  args: {
    ariaLabel: 'Action',
    children: <Icon name={ICONS.SUN} size={SIZE.SM} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

const NEXT_SLIDE = 'Next slide';

// Hover the rendered button in the canvas to check the hover affordance —
// the `border-emphasis` ring clears WCAG 1.4.11's 3:1 non-text minimum
// against `bg` on its own in both themes (see icon-button-variants.ts),
// with the `surface-2` fill as a secondary tint.
export const Default: TStory = {};

export const WithMoonIcon: TStory = {
  args: {
    ariaLabel: 'Switch to dark theme',
    children: <Icon name={ICONS.MOON} size={SIZE.SM} />,
  },
};

export const Disabled: TStory = {
  args: { isDisabled: true },
};

export const FocusableWhenDisabled: TStory = {
  args: {
    variant: 'control',
    ariaLabel: NEXT_SLIDE,
    children: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />,
    isDisabled: true,
    isFocusableWhenDisabled: true,
  },
};

export const Bordered: TStory = {
  args: {
    variant: 'bordered',
    ariaLabel: 'Sign in',
    children: 'Sign in',
  },
};

export const AvatarVariant: TStory = {
  name: 'Avatar',
  args: {
    variant: 'avatar',
    ariaLabel: 'Open account menu',
    children: <Avatar name="Ada Lovelace" alt="" size={SIZE.SM} />,
  },
};

export const Circle: TStory = {
  args: {
    variant: 'circle',
    ariaLabel: 'Toggle navigation menu',
    children: <Icon name={ICONS.MENU} size={SIZE.MD} />,
  },
};

export const CircleStates: TStory = {
  name: 'Circle — rest, open and focus',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <IconButton variant="circle" ariaLabel="Rest" title="Rest">
        <Icon name={ICONS.MENU} size={SIZE.MD} />
      </IconButton>
      <IconButton
        variant="circle"
        ariaLabel="Open"
        title="Open"
        aria-expanded={true}
      >
        <Icon name={ICONS.CLOSE} size={SIZE.MD} />
      </IconButton>
      <IconButton variant="circle" ariaLabel="Focus" title="Focus">
        <Icon name={ICONS.MENU} size={SIZE.MD} />
      </IconButton>
    </div>
  ),
  play: ({ canvasElement }) => {
    within(canvasElement).getByRole('button', { name: 'Focus' }).focus();
  },
};

export const CircleRestyledByTokens: TStory = {
  name: 'Circle — restyled by the header-control tokens',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {[HEADER_CONTROL_STYLE.SOFT, HEADER_CONTROL_STYLE.PLAIN].map((style) => (
        <div
          key={style}
          style={HEADER_CONTROL_STYLE_DECLARATIONS[style] as CSSProperties}
        >
          <IconButton variant="circle" ariaLabel={style} title={style}>
            <Icon name={ICONS.MENU} size={SIZE.MD} />
          </IconButton>
        </div>
      ))}
    </div>
  ),
};

export const CircleHeaderControlShapes: TStory = {
  name: 'Circle — header-control shapes',
  render: () => (
    <HeaderControlShapes>
      {(shape) => (
        <IconButton variant="circle" ariaLabel={shape} title={shape}>
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      )}
    </HeaderControlShapes>
  ),
};

export const Control: TStory = {
  args: {
    variant: 'control',
    ariaLabel: NEXT_SLIDE,
    children: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />,
  },
};

const ControlOnEveryBand = ({ isDisabled }: { isDisabled?: boolean }) => (
  <div style={{ display: 'flex', gap: '1.5rem' }}>
    {objectKeys(BRAND_BAND_LABELS).map((tone) => (
      <BrandBand key={tone} tone={tone}>
        <IconButton
          variant="control"
          ariaLabel={NEXT_SLIDE}
          title={NEXT_SLIDE}
          isDisabled={isDisabled}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </BrandBand>
    ))}
  </div>
);

export const ControlOnGrounds: TStory = {
  name: 'Control — on every ground',
  render: () => <ControlOnEveryBand />,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button', { name: NEXT_SLIDE });
    buttons[buttons.length - 1]?.focus();
  },
};

export const ControlDisabledOnGrounds: TStory = {
  name: 'Control — disabled, on every ground',
  render: () => <ControlOnEveryBand isDisabled={true} />,
};

export const ButtonShapesRow: TStory = {
  name: 'Button shapes',
  render: (args) => (
    <ButtonShapes>
      {() => (
        <>
          <IconButton {...args} />
          <IconButton {...args} {...Bordered.args} />
        </>
      )}
    </ButtonShapes>
  ),
};
