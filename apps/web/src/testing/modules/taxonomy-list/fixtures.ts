import type { ITaxonomyListModuleItem } from '@web/modules/taxonomy-list/taxonomy-list-module-view';

export const topicsListItems: ITaxonomyListModuleItem[] = [
  {
    id: 'topic-1',
    title: 'Engineering',
    description: 'Posts about building things.',
    postCountLabel: '5 posts',
    href: '/topics/engineering',
    posts: [
      {
        id: 'post-1',
        title: 'Shipping the new build pipeline',
        href: '/blog/shipping-the-new-build-pipeline',
      },
      {
        id: 'post-2',
        title: 'Why we rewrote our test runner',
        href: '/blog/why-we-rewrote-our-test-runner',
      },
    ],
    latestPostsLabel: 'Latest in Engineering',
  },
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

export const tagsListItems: ITaxonomyListModuleItem[] = [
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
