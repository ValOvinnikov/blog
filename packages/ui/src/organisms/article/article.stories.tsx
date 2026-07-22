import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

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

const meta = {
  title: 'Organisms/Article',
  component: Article,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: (
      <>
        <Article.Header
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
          meta={{
            author: {
              name: faker.person.fullName(),
              imageUrl: faker.image.avatarGitHub(),
            },
            publishedAt,
            formattedDate,
            readingTimeMinutes: faker.number.int({ min: 3, max: 15 }),
          }}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
} satisfies Meta<typeof Article>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithCoverMedia: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
          meta={{
            author: {
              name: faker.person.fullName(),
              imageUrl: faker.image.avatarGitHub(),
            },
            publishedAt,
            formattedDate,
            readingTimeMinutes: faker.number.int({ min: 3, max: 15 }),
          }}
          coverMedia={
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop"
              alt="Code editor showing component code"
            />
          }
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};

export const WithoutCategories: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
          meta={{
            author: { name: faker.person.fullName() },
            publishedAt,
            formattedDate,
          }}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};

export const WithMultipleCategories: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          categories={[
            { label: 'Engineering', href: '/category/engineering' },
            { label: 'Design Systems', href: '/category/design-systems' },
            { label: 'Tooling', href: '/category/tooling' },
          ]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
          meta={{
            author: { name: faker.person.fullName() },
            publishedAt,
            formattedDate,
          }}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};

export const WithoutLead: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          meta={{
            author: { name: faker.person.fullName() },
            publishedAt,
            formattedDate,
          }}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};

export const WithoutMeta: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};

export const WithShareSlot: TStory = {
  args: {
    children: (
      <>
        <Article.Header
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
          title={faker.lorem.sentence({ min: 4, max: 8 })}
          lead={faker.lorem.paragraph()}
          meta={{
            author: { name: faker.person.fullName() },
            publishedAt,
            formattedDate,
            share: <button type="button">Share</button>,
          }}
        />
        <Article.Body>{bodyParagraphs}</Article.Body>
      </>
    ),
  },
};
