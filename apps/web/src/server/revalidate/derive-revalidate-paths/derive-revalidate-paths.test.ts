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
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import {
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { makeTopic } from '@web/testing/shared/topic/fixtures';
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

const post = makePostCard();
const tag = makeTag();
const topic = makeTopic();
const UNRELATED_TAG_SLUG = 'unrelated-tag';
const LOCALE_ROOT = `/${DEFAULT_TENANT_ID}/${LOCALE_ISO_CODES.EN}`;

const postInput = {
  type: POST_TYPE,
  id: post.id,
  tenantId: DEFAULT_TENANT_ID,
  tenant: DEFAULT_TENANT_SANITY_CONTEXT,
};

describe('isDerivableRevalidateType', () => {
  it('is true only for page_post', () => {
    expect(isDerivableRevalidateType(POST_TYPE)).toBe(true);
    expect(isDerivableRevalidateType('person')).toBe(false);
    expect(isDerivableRevalidateType('page_home')).toBe(false);
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

  it('resolves every path for a published post, including its tag and topic pages', async () => {
    getTagParamsMock.mockResolvedValue(
      okResult([{ slug: tag.slug }, { slug: UNRELATED_TAG_SLUG }]),
    );
    getTopicParamsMock.mockResolvedValue(okResult([{ slug: topic.slug }]));

    const result = await deriveRevalidatePaths(postInput);

    expect(result).toEqual(
      okResult(
        expect.arrayContaining([
          LOCALE_ROOT,
          `${LOCALE_ROOT}/blog`,
          `${LOCALE_ROOT}/blog/${post.slug}`,
          `${LOCALE_ROOT}/tags/${tag.slug}`,
          `${LOCALE_ROOT}/tags/${UNRELATED_TAG_SLUG}`,
          `${LOCALE_ROOT}/topics/${topic.slug}`,
        ]),
      ),
    );
  });

  it('falls back with document_not_found when the id matches no post (e.g. a delete)', async () => {
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
      mock.mockResolvedValue(errorResult(new Error('boom')));

      const result = await deriveRevalidatePaths(postInput);

      expect(result).toEqual(errorResult(FETCH_FAILED_REASON));
      expect(loggerErrorMock).toHaveBeenCalledWith(
        event,
        expect.objectContaining({ id: post.id }),
      );
    },
  );
});
