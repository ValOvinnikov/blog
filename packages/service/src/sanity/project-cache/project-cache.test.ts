import { createProjectCache } from './project-cache';

function project(projectId: string) {
  return { projectId, dataset: 'production' };
}

describe(createProjectCache, () => {
  it('returns the cached entry for a repeated project', () => {
    const getOrCreate = createProjectCache<object>();
    const create = vi.fn(() => ({}));

    const first = getOrCreate(project('tenant-a'), create);
    const second = getOrCreate(project('tenant-a'), create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('keeps projects with the same id but different datasets apart', () => {
    const getOrCreate = createProjectCache<object>();
    const create = vi.fn(() => ({}));

    getOrCreate({ projectId: 'tenant-a', dataset: 'production' }, create);
    getOrCreate({ projectId: 'tenant-a', dataset: 'staging' }, create);

    expect(create).toHaveBeenCalledTimes(2);
  });

  it('replaces an entry that is no longer reusable', () => {
    const getOrCreate = createProjectCache<{ token: string }>();

    getOrCreate(project('tenant-a'), () => ({ token: 'old' }));
    const replaced = getOrCreate(
      project('tenant-a'),
      () => ({ token: 'new' }),
      (entry) => entry.token === 'new',
    );
    const reused = getOrCreate(
      project('tenant-a'),
      () => ({ token: 'newer' }),
      (entry) => entry.token === 'new',
    );

    expect(replaced.token).toBe('new');
    expect(reused).toBe(replaced);
  });

  it('evicts the least recently used project once 20 are cached', () => {
    const getOrCreate = createProjectCache<object>();
    const create = vi.fn(() => ({}));

    for (let i = 0; i < 20; i++) getOrCreate(project(`tenant-${i}`), create);
    getOrCreate(project('tenant-0'), create);
    getOrCreate(project('tenant-overflow'), create);
    expect(create).toHaveBeenCalledTimes(21);

    getOrCreate(project('tenant-0'), create);
    expect(create).toHaveBeenCalledTimes(21);

    getOrCreate(project('tenant-1'), create);
    expect(create).toHaveBeenCalledTimes(22);
  });
});
