import {
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
} from '@blog/service/testing/tenant';

import { createProjectCache } from './project-cache';

function project(projectId: string) {
  return { projectId, dataset: MOCK_TENANT_DATASET };
}

describe(createProjectCache, () => {
  let getOrCreate: ReturnType<typeof createProjectCache<object>>;
  let create: ReturnType<typeof vi.fn<() => object>>;

  beforeEach(() => {
    getOrCreate = createProjectCache<object>();
    create = vi.fn(() => ({}));
  });

  it('returns the cached entry for a repeated project', () => {
    const first = getOrCreate(project(MOCK_TENANT_PROJECT_ID), create);
    const second = getOrCreate(project(MOCK_TENANT_PROJECT_ID), create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('keeps projects with the same id but different datasets apart', () => {
    getOrCreate(
      { projectId: MOCK_TENANT_PROJECT_ID, dataset: MOCK_TENANT_DATASET },
      create,
    );
    getOrCreate(
      { projectId: MOCK_TENANT_PROJECT_ID, dataset: 'staging' },
      create,
    );

    expect(create).toHaveBeenCalledTimes(2);
  });

  it('replaces an entry that is no longer reusable', () => {
    const getOrCreateToken = createProjectCache<{ token: string }>();

    getOrCreateToken(project(MOCK_TENANT_PROJECT_ID), () => ({ token: 'old' }));
    const replaced = getOrCreateToken(
      project(MOCK_TENANT_PROJECT_ID),
      () => ({ token: 'new' }),
      (entry) => entry.token === 'new',
    );
    const reused = getOrCreateToken(
      project(MOCK_TENANT_PROJECT_ID),
      () => ({ token: 'newer' }),
      (entry) => entry.token === 'new',
    );

    expect(replaced.token).toBe('new');
    expect(reused).toBe(replaced);
  });

  it('evicts the least recently used project once 20 are cached', () => {
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
