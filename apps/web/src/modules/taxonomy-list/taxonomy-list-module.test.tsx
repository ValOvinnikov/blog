import { BRAND_VARIANT, TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import { TaxonomyListModule } from './taxonomy-list-module';

const { getTaxonomyListMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTaxonomyListMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      taxonomyList: { v1: { getTaxonomyList: getTaxonomyListMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const topicsResult = (entries: unknown[] = [], showLatestPosts = true) => ({
  ok: true,
  data: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock(),
    layout: undefined,
    contentAlignment: undefined,
    taxonomy: TAXONOMY_KIND.TOPICS,
    showLatestPosts,
    entries,
  },
});

const tagsResult = (entries: unknown[] = [], showLatestPosts = true) => ({
  ok: true,
  data: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock(),
    layout: undefined,
    contentAlignment: undefined,
    taxonomy: TAXONOMY_KIND.TAGS,
    showLatestPosts,
    entries,
  },
});

const entry = {
  id: 'topic-1',
  title: 'Engineering',
  slug: 'engineering',
  description: 'Posts about building things.',
  postCount: 5,
  latestPosts: [
    {
      id: 'post-1',
      title: 'Shipping the new build pipeline',
      slug: 'shipping-the-new-build-pipeline',
    },
    {
      id: 'post-2',
      title: 'Why we rewrote our test runner',
      slug: 'why-we-rewrote-our-test-runner',
    },
  ],
};

describe(`<${TaxonomyListModule.name}/>`, () => {
  beforeEach(() => {
    getTaxonomyListMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  describe('modules[] placement (no slot)', () => {
    const setup = customRenderAsync(TaxonomyListModule, {
      id: 'taxonomy-list-1',
      locale: 'en',
      tenant: 'tenant-1',
    });

    it('calls getTaxonomyList with no fallback taxonomy', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      expect(getTaxonomyListMock).toHaveBeenCalledWith(
        'taxonomy-list-1',
        DEFAULT_TENANT_SANITY_CONTEXT,
        undefined,
      );
    });

    it('renders topic entries with /topics hrefs and the topics postsCount copy', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult([entry]));

      await setup();

      const link = screen.getByRole('link', { name: /Engineering/ });
      expect(link).toHaveAttribute('href', '/topics/engineering');
      expect(screen.getByText('5 posts')).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 2, name: 'Topics' }),
      ).toBeInTheDocument();
    });

    it('defaults titleId and dataTestId from the module id when no slot is given', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult([entry]));

      await setup();

      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Topics',
      });
      expect(heading).toHaveAttribute('id', 'taxonomy-list-taxonomy-list-1');
      expect(screen.getByTestId('taxonomy-list-module-taxonomy-list-1')).toBe(
        heading.closest('section'),
      );
    });

    it('renders tag entries with /tags hrefs and the tags postsCount copy', async () => {
      getTaxonomyListMock.mockResolvedValue(
        tagsResult([
          { ...entry, id: 'tag-1', slug: 'typescript', title: 'TypeScript' },
        ]),
      );

      await setup();

      const link = screen.getByRole('link', { name: /TypeScript/ });
      expect(link).toHaveAttribute('href', '/tags/typescript');
      expect(screen.getByText('5 posts')).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 2, name: 'Tags' }),
      ).toBeInTheDocument();
    });

    it('renders nothing when entries is empty', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the fetch fails, without calling notFound()', async () => {
      getTaxonomyListMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('maps latestPosts to post-detail links, newest first, when showLatestPosts is on', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult([entry], true));

      await setup();

      const list = screen.getByRole('list', { name: 'Latest in Engineering' });
      const postLinks = within(list).getAllByRole('link');
      expect(postLinks.map((link) => link.textContent)).toEqual([
        'Shipping the new build pipeline',
        'Why we rewrote our test runner',
      ]);
      expect(postLinks[0]).toHaveAttribute(
        'href',
        '/blog/shipping-the-new-build-pipeline',
      );
    });

    it('omits the latest-posts list when showLatestPosts is off, even though the entry has posts', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult([entry], false));

      await setup();

      expect(
        screen.queryByRole('list', { name: 'Latest in Engineering' }),
      ).not.toBeInTheDocument();
    });

    it('omits the latest-posts list when the entry has no posts, even though the flag is on', async () => {
      getTaxonomyListMock.mockResolvedValue(
        topicsResult([{ ...entry, latestPosts: [] }], true),
      );

      await setup();

      expect(
        screen.queryByRole('list', { name: 'Latest in Engineering' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('index-page slot', () => {
    const setup = customRenderAsync(TaxonomyListModule, {
      id: 'topic-list-1',
      locale: 'en',
      tenant: 'tenant-1',
      slot: {
        fallbackTaxonomy: TAXONOMY_KIND.TOPICS,
        titleId: 'topic-list-title',
        dataTestId: 'taxonomy-list-module-topic-list-1',
        headingLevel: 2 as const,
        accessibleTitle: 'Topics',
        emptyMessage: 'No topics yet.',
      },
    });

    it('calls getTaxonomyList with the slot fallback taxonomy', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      expect(getTaxonomyListMock).toHaveBeenCalledWith(
        'topic-list-1',
        DEFAULT_TENANT_SANITY_CONTEXT,
        TAXONOMY_KIND.TOPICS,
      );
    });

    it('logs and calls notFound() when the fetch fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getTaxonomyListMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('taxonomy_list_module.fetch_failed'),
      );

      errorSpy.mockRestore();
    });

    it('renders the given emptyMessage when entries is empty', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      expect(screen.getByText('No topics yet.')).toBeVisible();
    });

    it('renders each entry linking through the resolved taxonomy href', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult([entry]));

      await setup();

      const link = screen.getByRole('link', { name: /Engineering/ });
      expect(link).toHaveAttribute('href', '/topics/engineering');
      expect(screen.getByText('5 posts')).toBeVisible();
    });

    it('forwards the resolved tenant Sanity context to getTaxonomyList', async () => {
      const tenant = {
        projectId: 'tenant-project',
        dataset: 'production',
        token: 'tenant-token',
      };
      getTenantSanityContextMock.mockResolvedValue(tenant);
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      expect(getTaxonomyListMock).toHaveBeenCalledWith(
        'topic-list-1',
        tenant,
        TAXONOMY_KIND.TOPICS,
      );
      expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
    });
  });
});
