import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import {
  BRAND_BAND_LABELS,
  BrandBand,
  focusLastLink,
} from '@blog/ui/testing/brand-bands';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

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
      options: objectKeys(textLinkVariants.variants.appearance),
    },
    variant: {
      control: 'select',
      options: objectKeys(textLinkVariants.variants.variant),
    },
    currentStyle: {
      control: 'select',
      options: objectKeys(textLinkVariants.variants.currentStyle),
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

const COMPARISONS: Array<{ name: string; today: ReactNode; next: ReactNode }> =
  [];

const SideBySide = () => (
  <div className="flex flex-col gap-6">
    {objectKeys(BRAND_BAND_LABELS).map((tone) => (
      <BrandBand key={tone} tone={tone}>
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-6 gap-y-3">
          <span className="font-mono text-meta text-muted">
            {BRAND_BAND_LABELS[tone]}
          </span>
          <span className="font-mono text-meta text-muted">Today</span>
          <span className="font-mono text-meta text-muted">TextLink</span>
          {COMPARISONS.map(({ name, today, next }) => (
            <div key={name} className="contents">
              <span className="font-mono text-meta text-muted">{name}</span>
              <span>{today}</span>
              <span>{next}</span>
            </div>
          ))}
        </div>
      </BrandBand>
    ))}
  </div>
);

export const ComparedWithTodaysAtomsLight: TStory = {
  name: "Compared with today's atoms — light",
  parameters: { layout: 'padded' },
  render: SideBySide,
};

export const ComparedWithTodaysAtomsDark: TStory = {
  name: "Compared with today's atoms — dark",
  parameters: { layout: 'padded' },
  globals: { theme: 'dark' },
  render: SideBySide,
};
