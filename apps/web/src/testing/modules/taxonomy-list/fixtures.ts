import type { ITaxonomyListModuleItem } from '@web/modules/taxonomy-list/taxonomy-list-module-view';

export const topicsListItems: ITaxonomyListModuleItem[] = [
  {
    id: 'topic-1',
    title: 'Engineering',
    description: 'Posts about building things.',
    postCountLabel: '5 posts',
    href: '/topics/engineering',
  },
  {
    id: 'topic-2',
    title: 'Design',
    description: 'Posts about craft and process.',
    postCountLabel: '1 post',
    href: '/topics/design',
  },
];

export const tagsListItems: ITaxonomyListModuleItem[] = [
  {
    id: 'tag-1',
    title: 'TypeScript',
    description: 'Posts tagged TypeScript.',
    postCountLabel: '8 posts',
    href: '/tags/typescript',
  },
  {
    id: 'tag-2',
    title: 'Accessibility',
    description: 'Posts tagged accessibility.',
    postCountLabel: '1 post',
    href: '/tags/accessibility',
  },
];
