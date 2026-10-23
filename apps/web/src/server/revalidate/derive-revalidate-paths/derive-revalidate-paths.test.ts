import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import {
  BLOG_PAGINATION_LOOKUP_FAILED_EVENT,
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  POST_LOOKUP_FAILED_EVENT,
  TAG_PAGINATION_LOOKUP_FAILED_EVENT,
  TAG_PARAMS_LOOKUP_FAILED_EVENT,
  TOPIC_PAGINATION_LOOKUP_FAILED_EVENT,
  TOPIC_PARAMS_LOOKUP_FAILED_EVENT,
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

const post = mockPostCard();
const tag = mockTag();
const topic = mockTopic();
const UNRELATED_TAG_SLUG = 'unrelated-tag';
const LOCALE_ROOT = `/${MOCK_TENANT_ID}/${LOCALE_ISO_CODES.EN}`;

const postInput = {
  type: POST_TYPE,
  id: post.id,
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
    getPostsByIdsMock.mockResolvedValue(okResult([post]));
    getIndexPageParamsMock.mockResolvedValue(okResult([]));
    getTagParamsMock.mockResolvedValue(okResult([]));
    getTagPaginationParamsMock.mockResolvedValue(okResult([]));
    getTopicParamsMock.mockResolvedValue(okResult([]));
    getTopicPaginationParamsMock.mockResolvedValue(okResult([]));
  });

  it('falls back with unsupported_type for an unknown type, skipping the service', async () => {
    const result = await deriveRevalidatePaths({
      ...postInput,
      type: 'person',
    });

    expect(result).toEqual(errorResult(UNSUPPORTED_TYPE_REASON));
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves every path a published post affects, tag and topic pages included', async () => {
    getTagParamsMock.mockResolvedValue(
      okResult([{ slug: tag.slug }, { slug: UNRELATED_TAG_SLUG }]),
    );
    getTopicParamsMock.mockResolvedValue(okResult([{ slug: topic.slug }]));

    const result = await deriveRevalidatePaths(postInput);

    expect(result).toEqual(
      okResult([
        LOCALE_ROOT,
        `${LOCALE_ROOT}/blog`,
        `${LOCALE_ROOT}/blog/${post.slug}`,
        `${LOCALE_ROOT}/tags/${tag.slug}`,
        `${LOCALE_ROOT}/tags/${UNRELATED_TAG_SLUG}`,
        `${LOCALE_ROOT}/topics/${topic.slug}`,
      ]),
    );
  });

  it('falls back with document_not_found when the id matches no post', async () => {
    getPostsByIdsMock.mockResolvedValue(okResult([]));

    const result = await deriveRevalidatePaths(postInput);

    expect(result).toEqual(errorResult(DOCUMENT_NOT_FOUND_REASON));
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      lookup: 'post by id',
      mock: getPostsByIdsMock,
      event: POST_LOOKUP_FAILED_EVENT,
    },
    {
      lookup: 'blog pagination',
      mock: getIndexPageParamsMock,
      event: BLOG_PAGINATION_LOOKUP_FAILED_EVENT,
    },
    {
      lookup: 'tag params',
      mock: getTagParamsMock,
      event: TAG_PARAMS_LOOKUP_FAILED_EVENT,
    },
    {
      lookup: 'tag pagination',
      mock: getTagPaginationParamsMock,
      event: TAG_PAGINATION_LOOKUP_FAILED_EVENT,
    },
    {
      lookup: 'topic params',
      mock: getTopicParamsMock,
      event: TOPIC_PARAMS_LOOKUP_FAILED_EVENT,
    },
    {
      lookup: 'topic pagination',
      mock: getTopicPaginationParamsMock,
      event: TOPIC_PAGINATION_LOOKUP_FAILED_EVENT,
    },
  ])(
    'falls back with fetch_failed and logs when the $lookup lookup fails',
    async ({ mock, event }) => {
      mock.mockResolvedValue(errorResult(MOCK_ERROR));

      const result = await deriveRevalidatePaths(postInput);

      expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
      expect(loggerErrorMock).toHaveBeenCalledWith(event, {
        id: post.id,
        error: MOCK_ERROR,
      });
    },
  );
});
