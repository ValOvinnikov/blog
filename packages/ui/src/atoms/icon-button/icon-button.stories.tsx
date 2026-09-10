import { BRAND_VARIANT, ICONS, SIZE } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
    tone: {
      control: 'select',
      options: objectKeys(iconButtonVariants.variants.tone),
    },
  },
  args: {
    ariaLabel: 'Action',
    children: <Icon name={ICONS.SUN} size={SIZE.SM} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

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

export const Control: TStory = {
  args: {
    variant: 'control',
    ariaLabel: 'Next slide',
    children: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />,
  },
};

// One brand-outline rest state on every ground; hover fills with the tint on
// the two neutral grounds and with the solid brand fill on the brand-tint
// ground, where the tint has nowhere else to go. Toggle the toolbar theme to
// check both light and dark.
export const ControlOnGrounds: TStory = {
  name: 'Control — on every ground',
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      <div
        className="bg-primary"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.PRIMARY}
          ariaLabel="Next slide"
          title="Next slide"
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
      <div
        className="bg-secondary"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.SECONDARY}
          ariaLabel="Next slide"
          title="Next slide"
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
      <div
        className="bg-brand-primary-muted"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.BRAND_PRIMARY}
          ariaLabel="Next slide"
          title="Next slide"
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
    </div>
  ),
};

// A disabled control keeps its brand ring and fades with it; toggle the toolbar theme to check both modes.
export const ControlDisabledOnGrounds: TStory = {
  name: 'Control — disabled, on every ground',
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      <div
        className="bg-primary"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.PRIMARY}
          ariaLabel="Next slide"
          title="Next slide"
          isDisabled={true}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
      <div
        className="bg-secondary"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.SECONDARY}
          ariaLabel="Next slide"
          title="Next slide"
          isDisabled={true}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
      <div
        className="bg-brand-primary-muted"
        style={{ padding: '1.5rem', borderRadius: '0.5rem' }}
      >
        <IconButton
          variant="control"
          tone={BRAND_VARIANT.BRAND_PRIMARY}
          ariaLabel="Next slide"
          title="Next slide"
          isDisabled={true}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
    </div>
  ),
};
