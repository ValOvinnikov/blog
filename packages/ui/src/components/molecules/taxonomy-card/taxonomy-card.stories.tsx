import { BRAND_VARIANT, type TBrandVariant } from '@shinefold/config';
import { CardGrid } from '@shinefold/ui/components/organisms/card-grid';
import { HEADING_LEVELS } from '@shinefold/ui/lib/react';
import {
  BRAND_BAND_LABELS,
  BrandBand,
  focusLastLink,
} from '@shinefold/ui/testing/brand-bands';
import { inNarrowColumn, threeAcross } from '@shinefold/ui/testing/card-widths';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TaxonomyCard } from './taxonomy-card';

const REACT_TAG = {
  title: 'react',
  href: '/tags/react',
  postCountLabel: '1 post',
};

const ENGINEERING_POSTS = [
  {
    id: '1',
    title: 'Refactoring the build pipeline',
    href: '/posts/refactoring-the-build-pipeline',
  },
  {
    id: '2',
    title: 'Why we moved to a monorepo',
    href: '/posts/why-we-moved-to-a-monorepo',
  },
];

const ENGINEERING_DESCRIPTION =
  'Posts about building things — architecture, tooling, and the craft of software.';

const meta = {
  title: 'Molecules/TaxonomyCard',
  component: TaxonomyCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    headingLevel: {
      control: 'select',
      options: HEADING_LEVELS,
    },
  },
  args: {
    title: 'Engineering',
    href: '/topics/engineering',
    headingLevel: 2,
    postCountLabel: '12 posts',
    isInteractive: true,
  },
} satisfies Meta<typeof TaxonomyCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithDescription: TStory = {
  args: {
    description: ENGINEERING_DESCRIPTION,
  },
};

export const NarrowColumn: TStory = {
  decorators: [inNarrowColumn],
  args: {
    description: ENGINEERING_DESCRIPTION,
  },
};

export const ThreeAcross: TStory = {
  decorators: [threeAcross],
  args: {
    description: ENGINEERING_DESCRIPTION,
  },
};

export const Static: TStory = {
  args: {
    isInteractive: false,
    description: ENGINEERING_DESCRIPTION,
  },
};

export const WithoutDescription: TStory = {
  args: REACT_TAG,
};

export const WithTwoPosts: TStory = {
  args: {
    description: ENGINEERING_DESCRIPTION,
  },
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts in ${args.title}`}
        label="Latest"
        posts={ENGINEERING_POSTS}
      />
    </TaxonomyCard>
  ),
};

export const WithOnePost: TStory = {
  args: REACT_TAG,
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts tagged ${args.title}`}
        label="Latest"
        posts={[
          {
            id: '1',
            title: 'Server Components in practice',
            href: '/posts/server-components-in-practice',
          },
        ]}
      />
    </TaxonomyCard>
  ),
};

export const WithNoPosts: TStory = {
  args: {
    description: ENGINEERING_DESCRIPTION,
  },
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts in ${args.title}`}
        posts={[]}
      />
    </TaxonomyCard>
  ),
};

const restingAndFocusedOn = (tone: TBrandVariant): TStory => ({
  name: `On a ${BRAND_BAND_LABELS[tone]} band — at rest and focused`,
  args: WithDescription.args,
  render: (args) => (
    <BrandBand tone={tone}>
      <div style={{ width: 280 }}>
        <TaxonomyCard {...args} />
      </div>
      <div style={{ width: 280 }}>
        <TaxonomyCard {...args} />
      </div>
    </BrandBand>
  ),
  play: focusLastLink,
});

export const OnPrimaryBand = restingAndFocusedOn(BRAND_VARIANT.PRIMARY);

export const OnSecondaryBand = restingAndFocusedOn(BRAND_VARIANT.SECONDARY);

export const OnBrandPrimaryBand = restingAndFocusedOn(
  BRAND_VARIANT.BRAND_PRIMARY,
);

export const Grid: TStory = {
  render: () => (
    <CardGrid>
      <TaxonomyCard
        title="Engineering"
        href="/topics/engineering"
        headingLevel={2}
        description={ENGINEERING_DESCRIPTION}
        postCountLabel="12 posts"
      >
        <TaxonomyCard.Posts
          ariaLabel="Latest posts in Engineering"
          label="Latest"
          posts={ENGINEERING_POSTS}
        />
      </TaxonomyCard>
      <TaxonomyCard
        title="Design"
        href="/topics/design"
        headingLevel={2}
        description="Visual and interaction design notes."
        postCountLabel="3 posts"
      >
        <TaxonomyCard.Posts
          ariaLabel="Latest posts in Design"
          label="Latest"
          posts={[
            {
              id: '1',
              title: 'A design system for the blog',
              href: '/posts/a-design-system-for-the-blog',
            },
          ]}
        />
      </TaxonomyCard>
      <TaxonomyCard {...REACT_TAG} headingLevel={2} />
    </CardGrid>
  ),
};
