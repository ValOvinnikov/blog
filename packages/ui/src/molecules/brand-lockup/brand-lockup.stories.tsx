import type { Meta, StoryObj } from '@storybook/react';

import { BrandLockup } from './brand-lockup';

const RESPONSIVE_VIEWPORTS = {
  phone: {
    name: 'Phone (<640px)',
    styles: { width: '375px', height: '400px' },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet (≥640px, <768px)',
    styles: { width: '700px', height: '400px' },
    type: 'tablet' as const,
  },
  desktop: {
    name: 'Desktop (≥768px)',
    styles: { width: '1024px', height: '400px' },
    type: 'desktop' as const,
  },
};

const meta = {
  title: 'Molecules/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['console', 'indigo'],
    },
  },
} satisfies Meta<typeof BrandLockup>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSpecLine: TStory = {
  args: { showSpec: true, specLine: 'v1.0.0 · build/local' },
};

export const PhoneMarkOnly: TStory = {
  args: { showSpec: true, specLine: 'v1.0.0 · build/local' },
  parameters: {
    viewport: { viewports: RESPONSIVE_VIEWPORTS, defaultViewport: 'phone' },
  },
};

export const TabletWithWordmark: TStory = {
  args: { showSpec: true, specLine: 'v1.0.0 · build/local' },
  parameters: {
    viewport: { viewports: RESPONSIVE_VIEWPORTS, defaultViewport: 'tablet' },
  },
};

export const DesktopWithSpecLine: TStory = {
  args: { showSpec: true, specLine: 'v1.0.0 · build/local' },
  parameters: {
    viewport: { viewports: RESPONSIVE_VIEWPORTS, defaultViewport: 'desktop' },
  },
};
