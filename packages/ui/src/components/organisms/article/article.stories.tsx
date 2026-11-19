import { faker } from '@faker-js/faker';
import { EveryBrandBand } from '@shinefold/ui/testing/brand-bands';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { Article } from './article';

const publishedAt = faker.date.past().toISOString();
const formattedDate = new Date(publishedAt).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const bodyParagraphs = faker.lorem
  .paragraphs(4, '\n\n')
  .split('\n\n')
  .map((paragraph) => <p key={paragraph}>{paragraph}</p>);

const ENGINEERING_TOPIC = {
  label: 'Engineering',
  href: '/topics/engineering',
};

const fullMeta = {
  author: {
    name: faker.person.fullName(),
    imageUrl: faker.image.avatarGitHub(),
  },
  publishedAt,
  formattedDate,
  readingTime: `${faker.number.int({ min: 3, max: 15 })} min read`,
};

const plainMeta = {
  author: { name: faker.person.fullName() },
  publishedAt,
  formattedDate,
};

const headerAction = <button type="button">30s</button>;

const coverImage = (
  <img
    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop"
    alt="Code editor showing component code"
  />
);

const articleArgs = (
  header: Omit<ComponentProps<typeof Article.Header>, 'title'>,
  footer?: ComponentProps<typeof Article.Footer>,
) => ({
  children: (
    <>
      <Article.Header
        title={faker.lorem.sentence({ min: 4, max: 8 })}
        {...header}
      />
      <Article.Body>{bodyParagraphs}</Article.Body>
      {footer && <Article.Footer {...footer} />}
    </>
  ),
});

const meta = {
  title: 'Organisms/Article',
  component: Article,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: articleArgs({
    topic: ENGINEERING_TOPIC,
    lead: faker.lorem.paragraph(),
    meta: fullMeta,
  }),
} satisfies Meta<typeof Article>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithCoverMedia: TStory = {
  args: articleArgs({
    topic: ENGINEERING_TOPIC,
    lead: faker.lorem.paragraph(),
    meta: fullMeta,
    coverMedia: coverImage,
  }),
};

export const WithUnlinkedTopic: TStory = {
  args: articleArgs({
    topic: { label: ENGINEERING_TOPIC.label },
    lead: faker.lorem.paragraph(),
    meta: plainMeta,
  }),
};

export const WithoutTopic: TStory = {
  args: articleArgs({ lead: faker.lorem.paragraph(), meta: plainMeta }),
};

export const WithoutLead: TStory = {
  args: articleArgs({ meta: plainMeta }),
};

export const WithoutMeta: TStory = {
  args: articleArgs({ lead: faker.lorem.paragraph() }),
};

export const WithFooterTags: TStory = {
  args: articleArgs(
    { lead: faker.lorem.paragraph(), meta: plainMeta },
    {
      tags: faker.helpers
        .multiple(() => faker.lorem.word(), { count: 4 })
        .map((label) => ({ label, href: `/tag/${label}` })),
    },
  ),
};

export const WithShareSlot: TStory = {
  args: articleArgs({
    lead: faker.lorem.paragraph(),
    meta: { ...plainMeta, share: <button type="button">Share</button> },
  }),
};

export const WithAction: TStory = {
  args: articleArgs({
    topic: ENGINEERING_TOPIC,
    lead: faker.lorem.paragraph(),
    meta: fullMeta,
    action: headerAction,
  }),
};

export const WithActionAndNoTopic: TStory = {
  args: articleArgs({ meta: plainMeta, action: headerAction }),
};

export const WithLeadAndCoverHidden: TStory = {
  args: articleArgs({
    topic: ENGINEERING_TOPIC,
    lead: faker.lorem.paragraph(),
    meta: fullMeta,
    action: headerAction,
    coverMedia: coverImage,
    className: '[&_[data-slot=lead]]:hidden [&_[data-slot=cover-media]]:hidden',
  }),
};

export const HeaderOnEveryBrandBand: TStory = {
  render: (args) => (
    <EveryBrandBand>{() => <Article {...args} />}</EveryBrandBand>
  ),
};
