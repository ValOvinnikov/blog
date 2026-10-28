import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PrimaryNavigation } from './primary-navigation';

const links = [
  { href: '/blog', label: 'Blog', isActive: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: faker.lorem.words(2) },
];

const linksWithSubItems = [
  ...links,
  {
    href: '/guides',
    label: 'Guides',
    subItems: [
      { href: '/guides', label: 'Guides' },
      { href: '/guides/getting-started', label: 'Getting started' },
      { href: '/guides/deployment', label: 'Deployment' },
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
    actions: <button type="button">Toggle theme</button>,
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
    actions: <button type="button">Account</button>,
    panelActions: (
      <>
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </>
    ),
    mobileToggle: openToggle,
  },
};

export const MobileOpenWithDrawerActions: TStory = {
  globals: { viewport: 'phone' },
  args: {
    actions: <button type="button">Account</button>,
    panelActions: (
      <>
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </>
    ),
    drawerActions: <button type="button">Sign in</button>,
    mobileToggle: openToggle,
  },
};

export const DesktopWithBothActions: TStory = {
  args: {
    actions: <button type="button">Account</button>,
    panelActions: (
      <>
        <button type="button">EN</button>
        <button type="button">Toggle theme</button>
      </>
    ),
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

export const MobileOpenWithSubmenus: TStory = {
  globals: { viewport: 'phone' },
  args: {
    links: linksWithSubItems,
    mobileToggle: openToggle,
  },
};
