import type { TModulePageContext } from './page-context';

describe('TModulePageContext narrowing', () => {
  it('exposes page/pageSize only when isPaginated is true', () => {
    const paginated: TModulePageContext = {
      type: 'BLOG',
      isPaginated: true,
      page: 2,
      pageSize: 12,
    };

    expect(paginated.page).toBe(2);
    expect(paginated.pageSize).toBe(12);

    const unpaginated: TModulePageContext = {
      type: 'HOME',
      isPaginated: false,
    };

    if (!unpaginated.isPaginated) {
      // @ts-expect-error `page` does not exist when isPaginated is false
      expect(unpaginated.page).toBeUndefined();
      // @ts-expect-error `pageSize` does not exist when isPaginated is false
      expect(unpaginated.pageSize).toBeUndefined();
    }
  });

  it('exposes topicSlug/tagSlug only for their own context type', () => {
    const topic: TModulePageContext = {
      type: 'TOPIC',
      topicSlug: 'engineering',
      isPaginated: false,
    };

    if (topic.type === 'TOPIC') {
      expect(topic.topicSlug).toBe('engineering');
    }

    const tag: TModulePageContext = {
      type: 'TAG',
      tagSlug: 'react',
      isPaginated: false,
    };

    if (tag.type === 'TAG') {
      expect(tag.tagSlug).toBe('react');
    }
  });

  it('makes topicSlug/tagSlug compile errors on non-scoped contexts', () => {
    const home: TModulePageContext = { type: 'HOME', isPaginated: false };
    const blog: TModulePageContext = { type: 'BLOG', isPaginated: false };
    const generic: TModulePageContext = {
      type: 'GENERIC',
      isPaginated: false,
    };

    if (home.type === 'HOME') {
      // @ts-expect-error `topicSlug` does not exist on the HOME context
      expect(home.topicSlug).toBeUndefined();
    }

    if (blog.type === 'BLOG') {
      // @ts-expect-error `topicSlug` does not exist on the BLOG context
      expect(blog.topicSlug).toBeUndefined();
    }

    if (generic.type === 'GENERIC') {
      // @ts-expect-error `topicSlug` does not exist on the GENERIC context
      expect(generic.topicSlug).toBeUndefined();
    }
  });
});
