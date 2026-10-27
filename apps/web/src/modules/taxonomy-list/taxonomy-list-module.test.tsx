import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
  SITE_MESSAGES,
  TAXONOMY_KIND,
  type TTaxonomyKind,
} from '@blog/config';
import type { TTaxonomyEntry, TTaxonomyListModule } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import {
  MOCK_FIRST_TOPIC_POST_TITLE,
  MOCK_SECOND_TOPIC_POST_TITLE,
} from '@web/testing/modules/taxonomy-list/fixtures';
import { ARIA_LABELLEDBY_ATTRIBUTE } from '@web/testing/shared/aria/constants';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TAXONOMY_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { MOCK_TAG_SLUG, mockTag } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopic } from '@web/testing/shared/topic/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { createTranslator } from 'next-intl';

import { TaxonomyListModule } from './taxonomy-list-module';

faker.seed(6011);

const { getTaxonomyListMock } = vi.hoisted(() => ({
  getTaxonomyListMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      taxonomyList: { v1: { getTaxonomyList: getTaxonomyListMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

const topicsT = createTranslator({
  locale: LOCALE_ISO_CODES.EN,
  messages: SITE_MESSAGES,
  namespace: 'taxonomyListModule.topics',
});
const tagsT = createTranslator({
  locale: LOCALE_ISO_CODES.EN,
  messages: SITE_MESSAGES,
  namespace: 'taxonomyListModule.tags',
});

const MOCK_TOPICS_HEADING = faker.lorem.words(2);
const MOCK_TAGS_HEADING = faker.lorem.words(2);
const MOCK_POST_COUNT = faker.number.int({ min: 2, max: 20 });
const MOCK_LINK_TEXT = faker.lorem.words(2);
const MOCK_OMITTED_TITLE = faker.lorem.words(2);

const mockTaxonomyResultFor =
  (taxonomy: TTaxonomyKind, heading: string) =>
  (entries: TTaxonomyEntry[] = [], showLatestPosts = true) => {
    const data: TTaxonomyListModule = {
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: mockHeadingBlock({ heading }),
      layout: undefined,
      contentAlignment: undefined,
      taxonomy,
      showLatestPosts,
      entries,
    };
    return okResult(data);
  };

const mockTopicsResult = mockTaxonomyResultFor(
  TAXONOMY_KIND.TOPICS,
  MOCK_TOPICS_HEADING,
);
const mockTagsResult = mockTaxonomyResultFor(
  TAXONOMY_KIND.TAGS,
  MOCK_TAGS_HEADING,
);

const MOCK_TOPIC_SLUG = faker.lorem.slug(2);
const MOCK_TOPIC = mockTopic({ slug: MOCK_TOPIC_SLUG });
const MOCK_TAG = mockTag();

const MOCK_TOPIC_ENTRY: TTaxonomyEntry = {
  ...MOCK_TOPIC,
  postCount: MOCK_POST_COUNT,
  latestPosts: [
    {
      id: faker.string.uuid(),
      title: MOCK_FIRST_TOPIC_POST_TITLE,
      slug: faker.lorem.slug(2),
    },
    {
      id: faker.string.uuid(),
      title: MOCK_SECOND_TOPIC_POST_TITLE,
      slug: faker.lorem.slug(2),
    },
  ],
};

const setup = customRenderAsync(TaxonomyListModule, {
  id: MOCK_TAXONOMY_LIST_ID,
});

describe(`<${TaxonomyListModule.name}/>`, () => {
  beforeEach(() => {
    getTaxonomyListMock.mockReset();
  });

  it('fetches the module with the tenant Sanity context', async () => {
    getTaxonomyListMock.mockResolvedValue(mockTopicsResult());

    await setup();

    expect(getTaxonomyListMock).toHaveBeenCalledWith(
      MOCK_TAXONOMY_LIST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  describe('with one topic entry', () => {
    beforeEach(async () => {
      getTaxonomyListMock.mockResolvedValue(
        mockTopicsResult([MOCK_TOPIC_ENTRY]),
      );

      await setup();
    });

    it('shows the translated latest label above the entry’s latest posts', () => {
      const latestLabel = screen.getByText(topicsT('latestLabel'));

      expect(latestLabel).toBeVisible();
    });

    it('links each latest post to its detail page, newest first', () => {
      const [firstPost, secondPost] = MOCK_TOPIC_ENTRY.latestPosts;
      const list = screen.getByRole('list', {
        name: topicsT('latestPostsLabel', { name: MOCK_TOPIC_ENTRY.title }),
      });
      const [firstLink, secondLink] = within(list).getAllByRole('link');

      expect(firstLink).toHaveTextContent(firstPost!.title);
      expect(firstLink).toHaveAttribute('href', routes.post(firstPost!.slug));
      expect(secondLink).toHaveTextContent(secondPost!.title);
      expect(secondLink).toHaveAttribute('href', routes.post(secondPost!.slug));
    });
  });

  it('omits an entry with no archive page', async () => {
    getTaxonomyListMock.mockResolvedValue(
      mockTopicsResult([
        MOCK_TOPIC_ENTRY,
        {
          ...MOCK_TOPIC_ENTRY,
          id: faker.string.uuid(),
          title: MOCK_OMITTED_TITLE,
          slug: undefined,
        },
      ]),
    );

    await setup();

    const link = screen.getByRole('link', {
      name: new RegExp(MOCK_TOPIC_ENTRY.title),
    });
    const omittedEntry = screen.queryByText(MOCK_OMITTED_TITLE);

    expect(link).toBeVisible();
    expect(omittedEntry).not.toBeInTheDocument();
  });

  it.each([
    {
      kind: TAXONOMY_KIND.TOPICS,
      result: mockTopicsResult([MOCK_TOPIC_ENTRY]),
      title: MOCK_TOPIC_ENTRY.title,
      href: routes.topic(MOCK_TOPIC_SLUG),
      postCountLabel: topicsT('postsCount', { count: MOCK_POST_COUNT }),
      heading: MOCK_TOPICS_HEADING,
    },
    {
      kind: TAXONOMY_KIND.TAGS,
      result: mockTagsResult([
        {
          ...MOCK_TOPIC_ENTRY,
          id: MOCK_TAG.id,
          slug: MOCK_TAG_SLUG,
          title: MOCK_TAG.title,
        },
      ]),
      title: MOCK_TAG.title,
      href: routes.tag(MOCK_TAG_SLUG),
      postCountLabel: tagsT('postsCount', { count: MOCK_POST_COUNT }),
      heading: MOCK_TAGS_HEADING,
    },
  ])(
    'renders $kind entries with their archive hrefs and post counts',
    async ({ result, title, href, postCountLabel, heading }) => {
      getTaxonomyListMock.mockResolvedValue(result);

      await setup();

      const link = screen.getByRole('link', { name: new RegExp(title) });
      const postCount = screen.getByText(postCountLabel);
      const sectionHeading = screen.getByRole('heading', {
        level: 2,
        name: heading,
      });

      expect(link).toHaveAttribute('href', href);
      expect(postCount).toBeVisible();
      expect(sectionHeading).toBeVisible();
    },
  );

  it.each([
    {
      kind: TAXONOMY_KIND.TOPICS,
      result: mockTopicsResult(),
      heading: MOCK_TOPICS_HEADING,
      emptyMessage: topicsT('empty'),
    },
    {
      kind: TAXONOMY_KIND.TAGS,
      result: mockTagsResult(),
      heading: MOCK_TAGS_HEADING,
      emptyMessage: tagsT('empty'),
    },
  ])(
    'renders a labelled section with the $kind empty message without entries',
    async ({ result, heading, emptyMessage }) => {
      getTaxonomyListMock.mockResolvedValue(result);

      await setup();

      const section = screen.getByRole('region', { name: heading });
      const message = within(section).getByText(emptyMessage);

      expect(message).toBeVisible();
    },
  );

  it('renders an authored link in the tags empty message', async () => {
    getTaxonomyListMock.mockResolvedValue(mockTagsResult());
    vi.mocked(getVoiceRich).mockResolvedValueOnce(
      mockFormattedVoiceRich({
        linkText: MOCK_LINK_TEXT,
        href: routes.blogIndex(),
      }),
    );

    await setup();

    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });

    expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('tagsEmpty');
    expect(link).toHaveAttribute('href', routes.blogIndex());
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTaxonomyListMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'taxonomy_list_module.fetch_failed',
      { id: MOCK_TAXONOMY_LIST_ID, error: MOCK_ERROR },
    );
  });

  it('labels each module region with its own heading', async () => {
    const otherId = faker.string.uuid();
    getTaxonomyListMock
      .mockResolvedValueOnce(mockTopicsResult())
      .mockResolvedValueOnce(mockTagsResult());

    await setup();
    await setup({ id: otherId });

    const topicsRegion = screen.getByRole('region', {
      name: MOCK_TOPICS_HEADING,
    });
    const tagsRegion = screen.getByRole('region', { name: MOCK_TAGS_HEADING });
    const topicsHeading = within(topicsRegion).getByRole('heading', {
      level: 2,
    });
    const tagsHeading = within(tagsRegion).getByRole('heading', { level: 2 });

    expect(topicsRegion).toHaveAttribute(
      ARIA_LABELLEDBY_ATTRIBUTE,
      topicsHeading.id,
    );
    expect(tagsRegion).toHaveAttribute(
      ARIA_LABELLEDBY_ATTRIBUTE,
      tagsHeading.id,
    );
    expect(topicsHeading.id).not.toBe(tagsHeading.id);
  });

  it('omits the latest-posts list when latest posts are switched off', async () => {
    getTaxonomyListMock.mockResolvedValue(
      mockTopicsResult([MOCK_TOPIC_ENTRY], false),
    );

    await setup();

    const list = screen.queryByRole('list', {
      name: topicsT('latestPostsLabel', { name: MOCK_TOPIC_ENTRY.title }),
    });

    expect(list).not.toBeInTheDocument();
  });
});
