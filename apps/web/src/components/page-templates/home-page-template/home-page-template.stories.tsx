import { Hero } from '@blog/ui/organisms';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HomePageTemplate } from './home-page-template';

const meta = {
  title: 'Page Templates/HomePageTemplate',
  component: HomePageTemplate,
  tags: ['autodocs'],
  args: {
    hero: (
      <Hero
        eyebrow="Welcome"
        title="Notes on building things"
        titleId="hero-title"
        excerpt="Essays and notes from the team, published as we ship."
      />
    ),
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        Page-builder modules render here
      </div>
    ),
  },
} satisfies Meta<typeof HomePageTemplate>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
