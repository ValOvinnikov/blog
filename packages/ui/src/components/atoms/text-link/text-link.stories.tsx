import { faker } from '@faker-js/faker';
import { BRAND_VARIANT, ICONS, SIZE } from '@shinefold/config';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import {
  BRAND_BAND_LABELS,
  BrandBand,
  focusLastLink,
} from '@shinefold/ui/testing/brand-bands';
import { SHINEFOLD_PRESET_STORY } from '@shinefold/ui/testing/shinefold-preset';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AnchorHTMLAttributes } from 'react';
import { keys } from 'remeda';

import { TextLink } from './text-link';
import { textLinkVariants } from './text-link-variants';

const LABEL = faker.lorem.words(3);

const MockLink = ({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} data-mock-router-link="true" {...rest}>
    {children}
  </a>
);

const meta = {
  title: 'Atoms/TextLink',
  component: TextLink,
  tags: ['autodocs'],
  args: { href: '#', children: LABEL },
  argTypes: {
    appearance: {
      control: 'select',
      options: keys(textLinkVariants.variants.appearance),
    },
    variant: {
      control: 'select',
      options: keys(textLinkVariants.variants.variant),
    },
    currentStyle: {
      control: 'select',
      options: keys(textLinkVariants.variants.currentStyle),
    },
    isCurrent: { control: 'boolean' },
    isStretched: { control: 'boolean' },
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Prose: TStory = {};

export const ProseDescendersAndWrapping: TStory = {
  name: 'Prose, descenders and wrapping',
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-copy">
        Read{' '}
        <TextLink {...args}>
          typography, spacing, and quality-of-reading guidelines
        </TextLink>{' '}
        before you publish.
      </p>
      <p className="max-w-56 text-copy">
        This paragraph is narrow, so{' '}
        <TextLink {...args}>
          a long link quietly spilling onto a second line
        </TextLink>{' '}
        keeps its underline on both.
      </p>
    </div>
  ),
};

const PROSE_LINK_BANDS = [
  BRAND_VARIANT.PRIMARY,
  BRAND_VARIANT.SECONDARY,
  BRAND_VARIANT.BRAND_PRIMARY,
];

export const ProseOnBrandBands: TStory = {
  name: 'Prose, on brand bands',
  render: (args) => (
    <div className="flex flex-col gap-6">
      {PROSE_LINK_BANDS.map((tone) => (
        <BrandBand key={tone} tone={tone}>
          <p className="text-copy">
            {BRAND_BAND_LABELS[tone]}: read{' '}
            <TextLink {...args}>the typography guidelines</TextLink> before you
            publish.
          </p>
        </BrandBand>
      ))}
    </div>
  ),
};

export const ProseOnBrandBandsDark: TStory = {
  ...ProseOnBrandBands,
  name: 'Prose, on brand bands, dark',
  globals: { theme: 'dark' },
};

export const Nav: TStory = { args: { appearance: 'nav' } };

export const NavCurrent: TStory = {
  args: { appearance: 'nav', isCurrent: true },
};

export const NavCurrentWeight: TStory = {
  args: { appearance: 'nav', isCurrent: true, currentStyle: 'weight' },
};

export const NavWithIcon: TStory = {
  args: {
    appearance: 'nav',
    children: (
      <>
        <Icon name={ICONS.RSS} size={SIZE.SM} />
        {LABEL}
      </>
    ),
  },
};

export const NavIconOnly: TStory = {
  args: {
    appearance: 'nav',
    ariaLabel: LABEL,
    title: LABEL,
    children: <Icon name={ICONS.RSS} size={SIZE.SM} />,
  },
};

export const NavOutlined: TStory = {
  args: { ...NavIconOnly.args, variant: 'outlined' },
};

export const Quiet: TStory = { args: { appearance: 'quiet' } };

export const QuietCurrent: TStory = {
  args: { appearance: 'quiet', isCurrent: true },
};

export const Accent: TStory = { args: { appearance: 'accent' } };

export const WithoutHref: TStory = {
  name: 'Without href — plain text',
  args: { href: undefined, appearance: 'nav', isCurrent: true },
};

export const AsRouterLink: TStory = { args: { as: MockLink } };

export const Stretched: TStory = {
  args: { isStretched: true, appearance: 'quiet' },
  decorators: [
    (Story) => (
      <div className="relative item-card surface-card px-card-x py-card-y">
        <Story />
        <p className="text-muted">The whole card is the link target.</p>
      </div>
    ),
  ],
};

export const StretchedFocused: TStory = {
  ...Stretched,
  play: focusLastLink,
};

export const ProseShinefoldPreset: TStory = {
  ...ProseDescendersAndWrapping,
  name: 'Prose, Shinefold preset',
  ...SHINEFOLD_PRESET_STORY,
};

export const QuietShinefoldPreset: TStory = {
  ...Quiet,
  ...SHINEFOLD_PRESET_STORY,
};
