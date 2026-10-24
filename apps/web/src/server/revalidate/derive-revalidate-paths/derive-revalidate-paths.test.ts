import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  UNSUPPORTED_TYPE_REASON,
} from '@web/constants/revalidate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { mockTag } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockTopic } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  deriveRevalidatePaths,
  isDerivableRevalidateType,
  POST_TYPE,
} from './derive-revalidate-paths';

faker.seed(5722);

const {
  getPostsByIdsMock,
  getIndexPageParamsMock,
  getTagParamsMock,
  getTagPaginationParamsMock,
  getTopicParamsMock,
  getTopicPaginationParamsMock,
} = vi.hoisted(() => ({
  getPostsByIdsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getTopicParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => {
  const { LOCALE_ISO_CODES } = await import('@blog/config');
  return {
    queries: {
      tenants: {
        getTenantLiveLocales: vi.fn().mockResolvedValue([LOCALE_ISO_CODES.EN]),
      },
    },
  };
});

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: {
        v1: {
          getPostsByIds: getPostsByIdsMock,
        },
      },
    },
    pages: {
      blog: { v1: { getIndexPageParams: getIndexPageParamsMock } },
      tag: {
        v1: {
          getTagParams: getTagParamsMock,
          getTagPaginationParams: getTagPaginationParamsMock,
        },
      },
      topic: {
        v1: {
          getTopicParams: getTopicParamsMock,
          getTopicPaginationParams: getTopicPaginationParamsMock,
        },
      },
    },
  },
}));

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_POST = mockPostCard();
const MOCK_TAG = mockTag();
const MOCK_TOPIC = mockTopic();
const MOCK_UNRELATED_TAG_SLUG = faker.lorem.slug();
const MOCK_LOCALE_ROOT = `/${MOCK_TENANT_ID}/${LOCALE_ISO_CODES.EN}`;

const MOCK_POST_INPUT = {
  type: POST_TYPE,
  id: MOCK_POST.id,
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

describe(isDerivableRevalidateType, () => {
  it.each([
    [POST_TYPE, true],
    ['person', false],
    ['page_home', false],
  ])('reports %s as derivable: %s', (type, expected) => {
    expect(isDerivableRevalidateType(type)).toBe(expected);
  });
});

describe(deriveRevalidatePaths, () => {
  beforeEach(() => {
    getPostsByIdsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getTagParamsMock.mockReset();
    getTagPaginationParamsMock.mockReset();
    getTopicParamsMock.mockReset();
    getTopicPaginationParamsMock.mockReset();
    loggerErrorMock.mockReset();
    getPostsByIdsMock.mockResolvedValue(okResult([MOCK_POST]));
    getIndexPageParamsMock.mockResolvedValue(okResult([]));
    getTagParamsMock.mockResolvedValue(okResult([]));
    getTagPaginationParamsMock.mockResolvedValue(okResult([]));
    getTopicParamsMock.mockResolvedValue(okResult([]));
    getTopicPaginationParamsMock.mockResolvedValue(okResult([]));
  });

  it('falls back with unsupported_type for an unknown type, skipping the service', async () => {
    const result = await deriveRevalidatePaths({
      ...MOCK_POST_INPUT,
      type: 'person',
    });

    expect(result).toEqual(errorResult(UNSUPPORTED_TYPE_REASON));
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves every path a published post affects, tag and topic pages included', async () => {
    getTagParamsMock.mockResolvedValue(
      okResult([{ slug: MOCK_TAG.slug }, { slug: MOCK_UNRELATED_TAG_SLUG }]),
    );
    getTopicParamsMock.mockResolvedValue(okResult([{ slug: MOCK_TOPIC.slug }]));

    const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

    expect(result).toEqual(
      okResult([
        MOCK_LOCALE_ROOT,
        `${MOCK_LOCALE_ROOT}/blog`,
        `${MOCK_LOCALE_ROOT}/blog/${MOCK_POST.slug}`,
        `${MOCK_LOCALE_ROOT}/tags/${MOCK_TAG.slug}`,
        `${MOCK_LOCALE_ROOT}/tags/${MOCK_UNRELATED_TAG_SLUG}`,
        `${MOCK_LOCALE_ROOT}/topics/${MOCK_TOPIC.slug}`,
      ]),
    );
  });

  it('falls back with document_not_found when the id matches no post', async () => {
    getPostsByIdsMock.mockResolvedValue(okResult([]));

    const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

    expect(result).toEqual(errorResult(DOCUMENT_NOT_FOUND_REASON));
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      lookup: 'post by id',
      mock: getPostsByIdsMock,
      event: REVALIDATE_LOG.POST_LOOKUP_FAILED,
    },
    {
      lookup: 'blog pagination',
      mock: getIndexPageParamsMock,
      event: REVALIDATE_LOG.BLOG_PAGINATION_LOOKUP_FAILED,
    },
    {
      lookup: 'tag params',
      mock: getTagParamsMock,
      event: REVALIDATE_LOG.TAG_PARAMS_LOOKUP_FAILED,
    },
    {
      lookup: 'tag pagination',
      mock: getTagPaginationParamsMock,
      event: REVALIDATE_LOG.TAG_PAGINATION_LOOKUP_FAILED,
    },
    {
      lookup: 'topic params',
      mock: getTopicParamsMock,
      event: REVALIDATE_LOG.TOPIC_PARAMS_LOOKUP_FAILED,
    },
    {
      lookup: 'topic pagination',
      mock: getTopicPaginationParamsMock,
      event: REVALIDATE_LOG.TOPIC_PAGINATION_LOOKUP_FAILED,
    },
  ])(
    'falls back with fetch_failed and logs when the $lookup lookup fails',
    async ({ mock, event }) => {
      mock.mockResolvedValue(errorResult(MOCK_ERROR));

      const result = await deriveRevalidatePaths(MOCK_POST_INPUT);

      expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
      expect(loggerErrorMock).toHaveBeenCalledWith(event, {
        id: MOCK_POST.id,
        error: MOCK_ERROR,
      });
    },
  );
});
