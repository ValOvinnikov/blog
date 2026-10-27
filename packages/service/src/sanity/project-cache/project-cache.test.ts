import {
  MOCK_PREVIOUS_TOKEN,
  MOCK_ROTATED_TOKEN,
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
} from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createProjectCache } from './project-cache';

faker.seed(6016);

const CACHE_CAPACITY = 20;
const MOCK_OTHER_DATASET = faker.lorem.word();
const MOCK_OVERFLOW_PROJECT_ID = faker.string.uuid();
const MOCK_PROJECT_IDS = Array.from({ length: CACHE_CAPACITY }, () =>
  faker.string.uuid(),
);
const [MOCK_OLDEST_PROJECT_ID = '', MOCK_SECOND_PROJECT_ID = ''] =
  MOCK_PROJECT_IDS;

function isRotated(entry: { token: string }) {
  return entry.token === MOCK_ROTATED_TOKEN;
}

function mockProject(projectId: string, dataset = MOCK_TENANT_DATASET) {
  return { projectId, dataset };
}

describe(createProjectCache, () => {
  let getOrCreate: ReturnType<typeof createProjectCache<object>>;
  let create: ReturnType<typeof vi.fn<() => object>>;

  beforeEach(() => {
    getOrCreate = createProjectCache<object>();
    create = vi.fn(() => ({}));
  });

  it('returns the cached entry for a repeated project', () => {
    const first = getOrCreate(mockProject(MOCK_TENANT_PROJECT_ID), create);
    const second = getOrCreate(mockProject(MOCK_TENANT_PROJECT_ID), create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('keeps projects with the same id but different datasets apart', () => {
    getOrCreate(mockProject(MOCK_TENANT_PROJECT_ID), create);
    getOrCreate(
      mockProject(MOCK_TENANT_PROJECT_ID, MOCK_OTHER_DATASET),
      create,
    );

    expect(create).toHaveBeenCalledTimes(2);
  });

  it('replaces an entry that is no longer reusable', () => {
    const getOrCreateToken = createProjectCache<{ token: string }>();

    getOrCreateToken(mockProject(MOCK_TENANT_PROJECT_ID), () => ({
      token: MOCK_PREVIOUS_TOKEN,
    }));
    const replaced = getOrCreateToken(
      mockProject(MOCK_TENANT_PROJECT_ID),
      () => ({ token: MOCK_ROTATED_TOKEN }),
      isRotated,
    );
    const reused = getOrCreateToken(
      mockProject(MOCK_TENANT_PROJECT_ID),
      () => ({ token: MOCK_PREVIOUS_TOKEN }),
      isRotated,
    );

    expect(replaced.token).toBe(MOCK_ROTATED_TOKEN);
    expect(reused).toBe(replaced);
  });

  describe('once full', () => {
    beforeEach(() => {
      for (const projectId of MOCK_PROJECT_IDS) {
        getOrCreate(mockProject(projectId), create);
      }
      getOrCreate(mockProject(MOCK_OLDEST_PROJECT_ID), create);
      getOrCreate(mockProject(MOCK_OVERFLOW_PROJECT_ID), create);
    });

    it('keeps a recently used project cached', () => {
      getOrCreate(mockProject(MOCK_OLDEST_PROJECT_ID), create);

      expect(create).toHaveBeenCalledTimes(CACHE_CAPACITY + 1);
    });

    it('evicts the least recently used project', () => {
      getOrCreate(mockProject(MOCK_SECOND_PROJECT_ID), create);

      expect(create).toHaveBeenCalledTimes(CACHE_CAPACITY + 2);
    });
  });
});
