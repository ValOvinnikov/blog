import { isr } from './isr';

describe(isr, () => {
  it('rejects a call site that omits the project id at compile time', () => {
    // @ts-expect-error -- `scopeProjectId` is required; there is no unscoped form that silently shares a cache tag across tenants.
    isr(['posts', 'author']);
  });

  it('prefixes every tag with t:<projectId>:', () => {
    expect(isr(['posts', 'author'], 'tenant-a')).toEqual({
      next: {
        revalidate: 3600,
        tags: ['t:tenant-a:posts', 't:tenant-a:author'],
      },
    });
  });

  it('accepts a single tag string the same as an array of one', () => {
    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });
});
