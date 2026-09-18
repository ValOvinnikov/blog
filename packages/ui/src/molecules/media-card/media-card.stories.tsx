import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaCard } from './media-card';
import { mediaCardVariants } from './media-card-variants';

const meta = {
  title: 'Molecules/MediaCard',
  component: MediaCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(mediaCardVariants.variants.align),
    },
  },
  args: {
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles.',
    tags: ['design-system', 'tailwind', 'react'],
    children: (
      <>
        <MediaCard.Media>
          <img
            src="https://picsum.photos/seed/designsystem/800/450"
            alt="Abstract design elements on a dark background"
          />
        </MediaCard.Media>
        <MediaCard.Meta
          dateValue="2024-03-10"
          dateLabel="March 10, 2024"
          readingTime="9 min"
        />
        <MediaCard.Title level={3}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
        <MediaCard.Footer
          topic="design-system"
          trailingIcon={<Icon name={ICONS.ARROW} size={SIZE.SM} />}
        />
      </>
    ),
  },
} satisfies Meta<typeof MediaCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Minimal: TStory = {
  args: {
    excerpt: undefined,
    tags: undefined,
    children: (
      <MediaCard.Title level={3}>
        <a href="/posts/minimal">A Minimal Post</a>
      </MediaCard.Title>
    ),
  },
};

export const WithoutFooter: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Meta
          dateValue="2024-03-10"
          dateLabel="March 10, 2024"
          readingTime="9 min"
        />
        <MediaCard.Title level={3}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const WithTags: TStory = {
  args: {
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript', 'tips'],
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href="/posts/typescript-tips">TypeScript Tips for 2024</a>
        </MediaCard.Title>
        <MediaCard.Footer
          topic="typescript"
          trailingIcon={<Icon name={ICONS.ARROW} size={SIZE.SM} />}
        />
      </>
    ),
  },
};

export const WithFooterLeadingIcon: TStory = {
  args: {
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript', 'tips'],
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href="/posts/typescript-tips">TypeScript Tips for 2024</a>
        </MediaCard.Title>
        <MediaCard.Footer
          topic="typescript"
          leadingIcon={<Icon name={ICONS.BOOKMARK} size={SIZE.SM} />}
          trailingIcon={<Icon name={ICONS.ARROW} size={SIZE.SM} />}
        />
      </>
    ),
  },
};

export const AsSecondLevelHeading: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Title level={2}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
        <MediaCard.Footer
          topic="design-system"
          trailingIcon={<Icon name={ICONS.ARROW} size={SIZE.SM} />}
        />
      </>
    ),
  },
};

export const Split: TStory = {
  args: {
    isSplit: true,
  },
};

export const Lead: TStory = {
  args: {
    isLead: true,
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles — from first primitives to a fully composed page.',
  },
};

export const LeadSplit: TStory = {
  args: {
    isLead: true,
    isSplit: true,
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles — from first primitives to a fully composed page.',
  },
};

export const WithAuthorFooter: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
        <MediaCard.Footer
          publishedAt="2024-03-10T09:00:00Z"
          formattedDate="March 10, 2024"
          authorName="Jane Doe"
          authorAvatarSrc="https://i.pravatar.cc/150?img=1"
        />
      </>
    ),
  },
};

export const WideMedia: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Media shape="wide">
          <img
            src="https://picsum.photos/seed/wide/800/450"
            alt="Abstract design elements on a dark background"
          />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const SquareMedia: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Media shape="square">
          <img
            src="https://picsum.photos/seed/square/600/600"
            alt="Abstract design elements on a dark background"
          />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const CircleMedia: TStory = {
  args: {
    excerpt: undefined,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="circle">
          <img
            src="https://i.pravatar.cc/224?img=12"
            alt="Portrait of the featured author"
          />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href="/team/jane-doe">Jane Doe</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const IconMedia: TStory = {
  args: {
    excerpt: 'Ship features faster with a shared, token-driven component set.',
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href="/features/design-system">Built for speed</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const CenterAligned: TStory = {
  args: {
    align: 'center',
    excerpt: 'Ship features faster with a shared, token-driven component set.',
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href="/features/design-system">Built for speed</a>
        </MediaCard.Title>
      </>
    ),
  },
};
