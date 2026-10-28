import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderSubmenuStyle,
} from '@blog/config';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { BrandLockup } from '@blog/ui/components/molecules/brand-lockup';
import {
  type INavItem,
  PrimaryNavigation,
} from '@blog/ui/components/molecules/primary-navigation';
import { objectKeys } from '@blog/utils/primitives';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Header, type THeaderProps } from './header';
import { headerVariants } from './header-variants';

const navLinks: INavItem[] = [
  { href: '/blog', label: 'Blog', isActive: true },
  {
    href: '/guides',
    label: 'Guides',
    subItems: [
      { href: '/guides', label: 'Guides' },
      { href: '/guides/getting-started', label: 'Getting started' },
      { href: '/guides/architecture', label: 'Architecture' },
      { href: '/guides/deployment', label: 'Deployment' },
      { href: '/guides/testing', label: 'Testing' },
      { href: '/guides/observability', label: 'Observability' },
      { href: '/guides/caching', label: 'Caching' },
      { href: '/guides/content-modelling', label: 'Content modelling' },
    ],
  },
  { href: '/modules', label: 'Modules' },
  {
    href: '/topics',
    label: 'Topics',
    subItems: [
      { href: '/topics', label: 'Topics' },
      { href: '/topics/frontend', label: 'Frontend' },
      { href: '/topics/backend', label: 'Backend' },
    ],
  },
  { href: '/about', label: 'About' },
];

const SiteHeader = ({
  submenuStyle,
  isMenuOpen: isInitiallyOpen = false,
  ...args
}: THeaderProps & {
  submenuStyle?: THeaderSubmenuStyle;
  isMenuOpen?: boolean;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(isInitiallyOpen);

  return (
    <Header {...args}>
      <Header.Brand>
        <a href="/">
          <BrandLockup
            src="https://placehold.co/64x64"
            tagline="Software · Backend · Frontend · AI"
          />
        </a>
      </Header.Brand>
      <PrimaryNavigation
        links={navLinks}
        layout={args.layout}
        submenuStyle={submenuStyle}
        panelActions={<ThemeToggle isDark={false} onToggle={() => {}} />}
        actions={<button type="button">Sign in</button>}
        mobileToggle={{
          isOpen: isMenuOpen,
          onToggle: () => setIsMenuOpen((current) => !current),
          ariaLabel: 'Toggle navigation menu',
          panelId: 'header-story-menu',
        }}
      />
    </Header>
  );
};

const withPageContent: Decorator = (Story) => (
  <>
    <Story />
    <p>The first line of the page sits below the bar.</p>
  </>
);

const meta = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    layout: {
      control: 'select',
      options: objectKeys(headerVariants.variants.layout),
    },
    barStyle: {
      control: 'select',
      options: objectKeys(headerVariants.variants.barStyle),
    },
  },
  args: {
    children: (
      <>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <TextLink appearance="nav" href="/" isCurrent={true}>
            Home
          </TextLink>
          <TextLink appearance="nav" href="/blog">
            Blog
          </TextLink>
          <TextLink appearance="nav" href="/about">
            About
          </TextLink>
        </Header.Nav>
        <Header.Actions>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </>
    ),
  },
} satisfies Meta<typeof Header>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const BrandOnly: TStory = {
  args: {
    children: <Header.Brand>My Blog</Header.Brand>,
  },
};

export const Classic: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <SiteHeader {...args} />,
};

export const LinksBesideBrand: TStory = {
  args: { layout: HEADER_LAYOUT.LINKS_BESIDE_BRAND },
  render: (args) => <SiteHeader {...args} />,
};

export const CentredLinks: TStory = {
  args: { layout: HEADER_LAYOUT.CENTRED_LINKS },
  render: (args) => <SiteHeader {...args} />,
};

export const TwoRows: TStory = {
  args: { layout: HEADER_LAYOUT.TWO_ROWS },
  render: (args) => <SiteHeader {...args} />,
};

export const CentredBrand: TStory = {
  args: { layout: HEADER_LAYOUT.CENTRED_BRAND },
  render: (args) => <SiteHeader {...args} />,
};

export const MenuButton: TStory = {
  args: { layout: HEADER_LAYOUT.MENU_BUTTON },
  render: (args) => <SiteHeader {...args} />,
};

export const WidePanelSubmenus: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader {...args} submenuStyle={HEADER_SUBMENU_STYLE.WIDE_PANEL} />
  ),
};

export const Floating: TStory = {
  decorators: [withPageContent],
  args: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FLOATING,
  },
  render: (args) => <SiteHeader {...args} />,
};

export const Phone: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <SiteHeader {...args} />,
};

export const PhoneMenuOpen: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <SiteHeader {...args} isMenuOpen={true} />,
};

export const PhoneFloating: TStory = {
  decorators: [withPageContent],
  globals: { viewport: 'phone' },
  args: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FLOATING,
  },
  render: (args) => <SiteHeader {...args} />,
};
