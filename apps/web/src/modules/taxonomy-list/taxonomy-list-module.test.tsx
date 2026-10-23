import {
  BRAND_VARIANT,
  NEXT_NAVIGATION_ERROR,
  TAXONOMY_KIND,
  type TTaxonomyKind,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import {
  MOCK_FIRST_TOPIC_POST_TITLE,
  MOCK_SECOND_TOPIC_POST_TITLE,
  MOCK_TOPIC_LIST_ITEM,
} from '@web/testing/modules/taxonomy-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { makeFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TaxonomyListModule } from './taxonomy-list-module';

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

const mockTaxonomyResultFor =
  (taxonomy: TTaxonomyKind, heading: string) =>
  (entries: unknown[] = [], showLatestPosts = true) =>
    okResult({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: makeHeadingBlock({ heading }),
      layout: undefined,
      contentAlignment: undefined,
      taxonomy,
      showLatestPosts,
      entries,
    });

const TOPICS_HEADING = 'Topics';

const mockTopicsResult = mockTaxonomyResultFor(
  TAXONOMY_KIND.TOPICS,
  TOPICS_HEADING,
);
const mockTagsResult = mockTaxonomyResultFor(TAXONOMY_KIND.TAGS, 'Tags');

const entry = {
  id: MOCK_TOPIC_LIST_ITEM.id,
  title: MOCK_TOPIC_LIST_ITEM.title,
  slug: 'engineering',
  description: MOCK_TOPIC_LIST_ITEM.description,
  postCount: 5,
  latestPosts: [
    {
      id: 'post-1',
      title: MOCK_FIRST_TOPIC_POST_TITLE,
      slug: 'shipping-the-new-build-pipeline',
    },
    {
      id: 'post-2',
      title: MOCK_SECOND_TOPIC_POST_TITLE,
      slug: 'why-we-rewrote-our-test-runner',
    },
  ],
};

const MODULE_ID = 'taxonomy-list-1';
const TAG = makeTag();
const READ_THE_BLOG = 'read the blog';

describe(`<${TaxonomyListModule.name}/>`, () => {
  beforeEach(() => {
    getTaxonomyListMock.mockReset();
  });

  describe('modules[] placement', () => {
    const setup = customRenderAsync(TaxonomyListModule, {
      id: MODULE_ID,
    });

    describe('with no topic entries', () => {
      beforeEach(async () => {
        getTaxonomyListMock.mockResolvedValue(mockTopicsResult());

        await setup();
      });

      it('fetches the module with the tenant Sanity context', async () => {
        expect(getTaxonomyListMock).toHaveBeenCalledWith(
          MODULE_ID,
          DEFAULT_TENANT_SANITY_CONTEXT,
        );
      });
    });

    describe('with one topic entry', () => {
      beforeEach(async () => {
        getTaxonomyListMock.mockResolvedValue(mockTopicsResult([entry]));

        await setup();
      });

      it('shows the translated latest label above the entry’s latest posts', async () => {
        const latestLabel = screen.getByText('Latest');
        expect(latestLabel).toBeVisible();
      });

      it('derives titleId and dataTestId from the module id', async () => {
        const heading = screen.getByRole('heading', {
          level: 2,
          name: TOPICS_HEADING,
        });
        const section = screen.getByRole('region', { name: TOPICS_HEADING });
        expect(heading).toHaveAttribute('id', 'taxonomy-list-taxonomy-list-1');
        const sectionByTestId = screen.getByTestId(
          'taxonomy-list-module-taxonomy-list-1',
        );
        expect(sectionByTestId).toBe(section);
      });

      it('links each latest post to its detail page, newest first', () => {
        const list = screen.getByRole('list', {
          name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
        });
        const postLinks = within(list).getAllByRole('link');
        expect(postLinks.map((link) => link.textContent)).toEqual([
          MOCK_FIRST_TOPIC_POST_TITLE,
          MOCK_SECOND_TOPIC_POST_TITLE,
        ]);
        expect(postLinks[0]).toHaveAttribute(
          'href',
          '/blog/shipping-the-new-build-pipeline',
        );
      });
    });

    it('omits an entry with no archive page', async () => {
      getTaxonomyListMock.mockResolvedValue(
        mockTopicsResult([
          entry,
          { ...entry, id: 'topic-2', title: 'Design', slug: undefined },
        ]),
      );

      await setup();

      const link = screen.getByRole('link', { name: /Engineering/ });
      const omittedEntry = screen.queryByText('Design');
      expect(link).toBeVisible();
      expect(omittedEntry).not.toBeInTheDocument();
    });

    it.each([
      {
        kind: TAXONOMY_KIND.TOPICS,
        result: mockTopicsResult([entry]),
        name: /Engineering/,
        href: MOCK_TOPIC_LIST_ITEM.href,
        heading: TOPICS_HEADING,
      },
      {
        kind: TAXONOMY_KIND.TAGS,
        result: mockTagsResult([
          { ...entry, id: TAG.id, slug: TAG.slug, title: TAG.title },
        ]),
        name: /TypeScript/,
        href: '/tags/typescript',
        heading: 'Tags',
      },
    ])(
      'renders $kind entries with their archive hrefs and post counts',
      async ({ result, name, href, heading }) => {
        getTaxonomyListMock.mockResolvedValue(result);

        await setup();

        const link = screen.getByRole('link', { name });
        const postCount = screen.getByText(MOCK_TOPIC_LIST_ITEM.postCountLabel);
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
        heading: TOPICS_HEADING,
        emptyMessage: 'No topics yet.',
      },
      {
        kind: TAXONOMY_KIND.TAGS,
        result: mockTagsResult(),
        heading: 'Tags',
        emptyMessage: 'No tags yet.',
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
        makeFormattedVoiceRich({ linkText: READ_THE_BLOG, href: '/blog' }),
      );

      await setup();

      expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('tagsEmpty');
      const link = screen.getByRole('link', { name: READ_THE_BLOG });
      expect(link).toHaveAttribute('href', '/blog');
    });

    it('logs and calls notFound() when the fetch fails', async () => {
      getTaxonomyListMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'taxonomy_list_module.fetch_failed',
        { id: MODULE_ID, error: MOCK_ERROR },
      );
    });

    it('omits the latest-posts list when latest posts are switched off', async () => {
      getTaxonomyListMock.mockResolvedValue(mockTopicsResult([entry], false));

      await setup();

      const list = screen.queryByRole('list', {
        name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
      });
      expect(list).not.toBeInTheDocument();
    });
  });
});
