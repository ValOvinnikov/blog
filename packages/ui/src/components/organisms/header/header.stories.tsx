import {
  BRAND_VARIANT,
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderSubmenuStyle,
} from '@shinefold/config';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { ThemeToggle } from '@shinefold/ui/components/atoms/theme-toggle';
import { BrandLockup } from '@shinefold/ui/components/molecules/brand-lockup';
import {
  type INavItem,
  PrimaryNavigation,
  type TPrimaryNavigationAction,
} from '@shinefold/ui/components/molecules/primary-navigation';
import { HeaderControlShapes } from '@shinefold/ui/testing/header-control-shapes';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { keys } from 'remeda';
import { userEvent, within } from 'storybook/test';

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

const headerAction: TPrimaryNavigationAction = {
  href: '/contact',
  label: 'Book a call',
};

type TSiteHeaderProps = THeaderProps & {
  submenuStyle?: THeaderSubmenuStyle;
  isMenuOpen?: boolean;
  links?: INavItem[];
  action?: TPrimaryNavigationAction;
};

const SiteHeader = ({
  submenuStyle,
  isMenuOpen: isInitiallyOpen = false,
  links = navLinks,
  action,
  ...args
}: TSiteHeaderProps) => {
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
        links={links}
        action={action}
        layout={args.layout}
        submenuStyle={submenuStyle}
        mobileToggle={{
          isOpen: isMenuOpen,
          onToggle: () => setIsMenuOpen((current) => !current),
          ariaLabel: 'Toggle navigation menu',
          panelId: `header-story-menu-${args.tone ?? 'page'}`,
        }}
      >
        <PrimaryNavigation.PanelActions>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </PrimaryNavigation.PanelActions>
        <PrimaryNavigation.Actions>
          <button type="button">Sign in</button>
        </PrimaryNavigation.Actions>
      </PrimaryNavigation>
    </Header>
  );
};

const AllTones = (args: TSiteHeaderProps) => (
  <div className="flex flex-col gap-8">
    {Object.values(BRAND_VARIANT).map((tone) => (
      <div
        key={tone}
        className={args.isMenuOpen ? 'min-h-[30rem]' : 'min-h-40'}
      >
        <SiteHeader {...args} tone={tone} />
      </div>
    ))}
  </div>
);

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
      options: keys(headerVariants.variants.layout),
    },
    barStyle: {
      control: 'select',
      options: keys(headerVariants.variants.barStyle),
    },
    tone: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
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

export const FloatingWidePanelOpen: TStory = {
  decorators: [withPageContent],
  args: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FLOATING,
  },
  render: (args) => (
    <SiteHeader {...args} submenuStyle={HEADER_SUBMENU_STYLE.WIDE_PANEL} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Guides' }),
    );
  },
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

export const Skins: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: AllTones,
};

export const SkinsDark: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: AllTones,
  globals: { theme: 'dark' },
};

export const FloatingSkins: TStory = {
  args: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FLOATING,
  },
  render: AllTones,
};

export const FloatingSkinsDark: TStory = {
  args: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FLOATING,
  },
  render: AllTones,
  globals: { theme: 'dark' },
};

export const PhoneMenuOpenSkins: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <AllTones {...args} isMenuOpen={true} />,
};

export const PhoneMenuOpenSkinsDark: TStory = {
  globals: { viewport: 'phone', theme: 'dark' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <AllTones {...args} isMenuOpen={true} />,
};

export const ActionFilled: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader
      {...args}
      action={{ ...headerAction, style: HEADER_ACTION_STYLE.FILLED }}
    />
  ),
};

export const ActionOutlined: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader
      {...args}
      action={{ ...headerAction, style: HEADER_ACTION_STYLE.OUTLINED }}
    />
  ),
};

export const ActionPlainLink: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader
      {...args}
      action={{ ...headerAction, style: HEADER_ACTION_STYLE.PLAIN }}
    />
  ),
};

export const ActionHeaderControlShapes: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <HeaderControlShapes>
      {() => (
        <>
          <SiteHeader {...args} action={headerAction} />
          <SiteHeader
            {...args}
            action={{ ...headerAction, style: HEADER_ACTION_STYLE.OUTLINED }}
          />
        </>
      )}
    </HeaderControlShapes>
  ),
};

export const PhoneMenuActionHeaderControlShapes: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <HeaderControlShapes>
      {() => (
        <SiteHeader
          {...args}
          isMenuOpen={true}
          action={{
            ...headerAction,
            phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
          }}
        />
      )}
    </HeaderControlShapes>
  ),
};

export const ActionInEveryLayout: TStory = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      {Object.values(HEADER_LAYOUT).map((layout) => (
        <SiteHeader
          key={layout}
          {...args}
          layout={layout}
          action={headerAction}
        />
      ))}
    </div>
  ),
};

export const ActionSkins: TStory = {
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => <AllTones {...args} action={headerAction} />,
};

export const PhoneActionInBar: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader
      {...args}
      action={{
        ...headerAction,
        phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.BAR,
      }}
    />
  ),
};

export const PhoneActionInMenu: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader
      {...args}
      isMenuOpen={true}
      action={{
        ...headerAction,
        phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
      }}
    />
  ),
};

export const PhoneMenuHoldsOnlyAction: TStory = {
  globals: { viewport: 'phone' },
  args: { layout: HEADER_LAYOUT.CLASSIC },
  render: (args) => (
    <SiteHeader {...args} links={[]} isMenuOpen={true} action={headerAction} />
  ),
};
