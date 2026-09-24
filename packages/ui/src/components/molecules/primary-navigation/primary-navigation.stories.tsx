import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PrimaryNavigation } from './primary-navigation';

const links = [
  { href: '/blog', label: 'Blog', isActive: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: faker.lorem.words(2) },
];

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
    mobileToggle: {
      isOpen: false,
      onToggle: () => {},
      ariaLabel: 'Toggle navigation menu',
      panelId: 'primary-navigation-panel',
    },
  },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'phone' },
  args: {
    mobileToggle: {
      isOpen: true,
      onToggle: () => {},
      ariaLabel: 'Toggle navigation menu',
      panelId: 'primary-navigation-panel',
    },
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
        ariaLabel: 'Toggle navigation menu',
        panelId: 'primary-navigation-interactive-panel',
      }}
    />
  );
};

export const MobileInteractive: TStory = {
  globals: { viewport: 'phone' },
  render: () => <InteractiveMobileDemo />,
};
