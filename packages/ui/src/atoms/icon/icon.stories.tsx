import { ICONS, Size } from '@blog/config';
import { objectKeys, toTitleCase } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from './icon';
import { iconVariants } from './icon-variants';

const iconNames = objectKeys(ICONS);

const IconGallery = () => (
  <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
    {iconNames.map((name) => (
      <div
        key={name}
        className="flex flex-col items-center gap-2 rounded-md border border-border p-4 text-center"
      >
        <Icon name={name} size={Size.LG} />
        <span className="font-mono text-label text-text-muted">
          {toTitleCase(name)}
        </span>
      </div>
    ))}
  </div>
);

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    name: ICONS.SUN,
  },
  argTypes: {
    size: {
      control: 'select',
      options: objectKeys(iconVariants.variants.size),
    },
    variant: {
      control: 'select',
      options: objectKeys(iconVariants.variants.variant),
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Small: TStory = {
  args: { size: Size.SM },
};

export const Large: TStory = {
  args: { size: Size.LG },
};

export const CustomColor: TStory = {
  args: { name: ICONS.SHARE, className: 'text-brand-primary' },
};

export const WithAccessibleLabel: TStory = {
  args: { name: ICONS.SHARE, 'aria-label': 'Share this post' },
};

export const Gallery: TStory = {
  render: () => <IconGallery />,
};

export const ChevronDown: TStory = {
  args: { name: ICONS.CHEVRON_RIGHT, variant: 'chevronDown' },
};

/**
 * `chevronOpen` rotates via the native `<details>`/`<summary>` disclosure
 * state (`group-open:`), so it needs a real open and closed pair to show
 * both rotation states — a static `args.variant` alone would only ever
 * render one of them.
 */
export const ChevronOpenDisclosure: TStory = {
  render: () => (
    <div className="flex gap-8">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <Icon name={ICONS.CHEVRON_RIGHT} variant="chevronOpen" />
          Closed
        </summary>
        <p className="pt-2 text-sm">Revealed content</p>
      </details>
      <details className="group" open={true}>
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <Icon name={ICONS.CHEVRON_RIGHT} variant="chevronOpen" />
          Open
        </summary>
        <p className="pt-2 text-sm">Revealed content</p>
      </details>
    </div>
  ),
};
