import type { ITaxonomyListModuleItem } from '@web/modules/taxonomy-list/taxonomy-list-module-view';

export const MOCK_FIRST_TOPIC_POST_TITLE = 'Shipping the new build pipeline';

export const MOCK_SECOND_TOPIC_POST_TITLE = 'Why we rewrote our test runner';

export const MOCK_TOPIC_DESCRIPTION = 'Posts about building things.';

export const MOCK_TOPIC_LIST_ITEM: ITaxonomyListModuleItem = {
  id: 'topic-1',
  title: 'Engineering',
  description: MOCK_TOPIC_DESCRIPTION,
  postCountLabel: '5 posts',
  href: '/topics/engineering',
  posts: [
    {
      id: 'post-1',
      title: MOCK_FIRST_TOPIC_POST_TITLE,
      href: '/blog/shipping-the-new-build-pipeline',
    },
    {
      id: 'post-2',
      title: MOCK_SECOND_TOPIC_POST_TITLE,
      href: '/blog/why-we-rewrote-our-test-runner',
    },
  ],
  latestPostsLabel: 'Latest in Engineering',
};

export const MOCK_TOPICS_LIST_ITEMS: ITaxonomyListModuleItem[] = [
  MOCK_TOPIC_LIST_ITEM,
  {
    id: 'topic-2',
    title: 'Design',
    description: 'Posts about craft and process.',
    postCountLabel: '1 post',
    href: '/topics/design',
    posts: [],
    latestPostsLabel: 'Latest in Design',
  },
];

export const MOCK_TAGS_LIST_ITEMS: ITaxonomyListModuleItem[] = [
  {
    id: 'tag-1',
    title: 'TypeScript',
    description: 'Posts tagged TypeScript.',
    postCountLabel: '8 posts',
    href: '/tags/typescript',
    posts: [
      {
        id: 'post-3',
        title: 'Narrowing without the ceremony',
        href: '/blog/narrowing-without-the-ceremony',
      },
      {
        id: 'post-4',
        title: 'Generic inference in practice',
        href: '/blog/generic-inference-in-practice',
      },
    ],
    latestPostsLabel: 'Latest in TypeScript',
  },
  {
    id: 'tag-2',
    title: 'Accessibility',
    description: 'Posts tagged accessibility.',
    postCountLabel: '1 post',
    href: '/tags/accessibility',
    posts: [],
    latestPostsLabel: 'Latest in Accessibility',
  },
];
