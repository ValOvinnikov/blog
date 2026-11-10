import {
  HEADER_SUBMENU_STYLE,
  NAV_LINK_STYLE_DECLARATIONS,
} from '@blog/config';
import { StyleVariants } from '@blog/ui/testing/style-variants';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PrimaryNavigation } from './primary-navigation';

const links = [
  { href: '/blog', label: 'Blog', isActive: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: faker.lorem.words(2) },
];

const GUIDES_HREF = '/guides';
const GUIDES_LABEL = 'Guides';

const guides = {
  href: GUIDES_HREF,
  label: GUIDES_LABEL,
  subItems: [
    { href: GUIDES_HREF, label: GUIDES_LABEL },
    { href: `${GUIDES_HREF}/getting-started`, label: 'Getting started' },
    { href: `${GUIDES_HREF}/deployment`, label: 'Deployment' },
  ],
};

const linksWithSubItems = [...links, guides];

const linksWithCurrentSubItem = [
  ...links.slice(1),
  {
    ...guides,
    isActive: true,
    subItems: [
      ...guides.subItems,
      { href: `${GUIDES_HREF}/theming`, label: 'Theming', isActive: true },
    ],
  },
];

const TOGGLE_LABEL = 'Toggle navigation menu';
const PANEL_ID = 'primary-navigation-panel';

const closedToggle = {
  isOpen: false,
  onToggle: () => {},
  ariaLabel: TOGGLE_LABEL,
  panelId: PANEL_ID,
};

const openToggle = { ...closedToggle, isOpen: true };

const meta = {
  title: 'Molecules/PrimaryNavigation',
  component: PrimaryNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { links },
} satisfies Meta<typeof PrimaryNavigation>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithActions: TStory = {
  args: {
    children: (
      <PrimaryNavigation.Actions>
        <button type="button">Toggle theme</button>
      </PrimaryNavigation.Actions>
    ),
  },
};

export const WithExternalLink: TStory = {
  args: {
    links: [
      { href: '/blog', label: 'Blog', isActive: true },
      { href: '/about', label: 'About' },
      {
        href: faker.internet.url(),
        label: 'Docs',
        target: '_blank',
      },
    ],
  },
};

// The `mobileToggle` collapse is driven by real `lg:` media-query variants
// (see primary-navigation-variants.ts), not a container query — a wrapping
// element's width has no effect on which rules match, only the actual
// canvas/viewport width does. `globals: { viewport: 'phone' }` (the
// Storybook 10 replacement for the removed `parameters.viewport.
// defaultViewport`) is the only way to default these stories to a width
// under `lg` so the collapsed state is what actually renders — an
// intentional, narrow exception to not overriding viewport per story.
export const MobileClosed: TStory = {
  globals: { viewport: 'phone' },
  args: {
    mobileToggle: closedToggle,
  },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'phone' },
  args: {
    mobileToggle: openToggle,
  },
};

export const MobileOpenWithPanelActions: TStory = {
  globals: { viewport: 'phone' },
  args: {
    children: [
      <PrimaryNavigation.Actions key="actions">
        <button type="button">Account</button>
      </PrimaryNavigation.Actions>,
      <PrimaryNavigation.PanelActions key="panel-actions">
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </PrimaryNavigation.PanelActions>,
    ],
    mobileToggle: openToggle,
  },
};

export const MobileOpenWithDrawerActions: TStory = {
  globals: { viewport: 'phone' },
  args: {
    children: [
      <PrimaryNavigation.Actions key="actions">
        <button type="button">Account</button>
      </PrimaryNavigation.Actions>,
      <PrimaryNavigation.PanelActions key="panel-actions">
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </PrimaryNavigation.PanelActions>,
      <PrimaryNavigation.DrawerActions key="drawer-actions">
        <button type="button">Sign in</button>
      </PrimaryNavigation.DrawerActions>,
    ],
    mobileToggle: openToggle,
  },
};

export const DesktopWithBothActions: TStory = {
  args: {
    children: [
      <PrimaryNavigation.Actions key="actions">
        <button type="button">Account</button>
      </PrimaryNavigation.Actions>,
      <PrimaryNavigation.PanelActions key="panel-actions">
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </PrimaryNavigation.PanelActions>,
    ],
    mobileToggle: closedToggle,
  },
};

const InteractiveMobileDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PrimaryNavigation
      links={links}
      mobileToggle={{
        isOpen,
        onToggle: () => setIsOpen((current) => !current),
        ariaLabel: TOGGLE_LABEL,
        panelId: 'primary-navigation-interactive-panel',
      }}
    />
  );
};

export const MobileInteractive: TStory = {
  globals: { viewport: 'phone' },
  render: () => <InteractiveMobileDemo />,
};

export const WithSubmenus: TStory = {
  args: { links: linksWithSubItems },
};

export const NavLinkStyles: TStory = {
  render: () => (
    <StyleVariants
      declarations={NAV_LINK_STYLE_DECLARATIONS}
      className="flex flex-col gap-8"
      variantClassName="flex flex-col gap-3"
    >
      {() => (
        <>
          <PrimaryNavigation links={linksWithSubItems} />
          <PrimaryNavigation links={linksWithCurrentSubItem} />
        </>
      )}
    </StyleVariants>
  ),
};

export const WithCurrentSubmenuItem: TStory = {
  args: { links: linksWithCurrentSubItem },
};

export const WithCurrentWidePanelItem: TStory = {
  args: {
    links: linksWithCurrentSubItem,
    submenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  },
};

export const MobileOpenWithCurrentSubmenuItem: TStory = {
  globals: { viewport: 'phone' },
  args: {
    links: linksWithCurrentSubItem,
    mobileToggle: openToggle,
  },
};

export const MobileOpenWithSubmenus: TStory = {
  globals: { viewport: 'phone' },
  args: {
    links: linksWithSubItems,
    mobileToggle: openToggle,
  },
};

const SHARED_GROUP_NAME = 'primary-navigation-shared-group';

/** A disclosure in the drawer slot that takes `groupName` folds an open sub-menu when it opens, and the reverse. */
export const MobileOpenWithGroupedDrawerActions: TStory = {
  globals: { viewport: 'phone' },
  args: {
    links: linksWithSubItems,
    groupName: SHARED_GROUP_NAME,
    mobileToggle: openToggle,
    children: (
      <PrimaryNavigation.DrawerActions>
        <details name={SHARED_GROUP_NAME}>
          <summary>Account</summary>
          <button type="button">Sign out</button>
        </details>
      </PrimaryNavigation.DrawerActions>
    ),
  },
};
