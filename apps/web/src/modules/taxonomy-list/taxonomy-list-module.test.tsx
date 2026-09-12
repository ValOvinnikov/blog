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
    headingBlock: makeHeadingBlock({ heading: '' }),
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
    headingBlock: makeHeadingBlock({ heading: '' }),
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

  describe('modules[] placement', () => {
    const setup = customRenderAsync(TaxonomyListModule, {
      id: 'taxonomy-list-1',
      locale: 'en',
      tenant: 'tenant-1',
    });

    it('resolves the tenant Sanity context from the tenant slug and forwards it to getTaxonomyList', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
      expect(getTaxonomyListMock).toHaveBeenCalledWith(
        'taxonomy-list-1',
        DEFAULT_TENANT_SANITY_CONTEXT,
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

    it('derives titleId and dataTestId from the module id', async () => {
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

    it('renders a labeled section with the topics empty message when entries is empty', async () => {
      getTaxonomyListMock.mockResolvedValue(topicsResult());

      await setup();

      const section = screen.getByRole('region', { name: 'Topics' });
      expect(within(section).getByText('No topics yet.')).toBeVisible();
    });

    it('renders a labeled section with the tags empty message when entries is empty', async () => {
      getTaxonomyListMock.mockResolvedValue(tagsResult());

      await setup();

      const section = screen.getByRole('region', { name: 'Tags' });
      expect(within(section).getByText('No tags yet.')).toBeVisible();
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
});
