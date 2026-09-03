import { BRAND_VARIANT, TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
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

const setup = customRenderAsync(TaxonomyListModule, {
  id: 'topic-list-1',
  taxonomy: TAXONOMY_KIND.TOPICS,
  titleId: 'topic-list-title',
  dataTestId: 'taxonomy-list-module-topic-list-1',
  headingLevel: 2,
  accessibleTitle: 'Topics',
  emptyMessage: 'No topics yet.',
  buildHref: (slug: string) => `/topics/${slug}`,
  formatPostCount: (count: number) =>
    count === 1 ? '1 post' : `${count} posts`,
});

describe(TaxonomyListModule, () => {
  beforeEach(() => {
    getTaxonomyListMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    getTaxonomyListMock.mockResolvedValue({ ok: false, error });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('taxonomy_list_module.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls getTaxonomyList with the module id and taxonomy kind', async () => {
    getTaxonomyListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Browse by topic',
          supportingText: undefined,
          align: undefined,
        },
        layout: undefined,
        entries: [],
      },
    });

    await setup();

    expect(getTaxonomyListMock).toHaveBeenCalledWith(
      'topic-list-1',
      TAXONOMY_KIND.TOPICS,
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('forwards the resolved tenant Sanity context to getTaxonomyList', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getTaxonomyListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Browse by topic',
          supportingText: undefined,
          align: undefined,
        },
        layout: undefined,
        entries: [],
      },
    });

    await setup();

    expect(getTaxonomyListMock).toHaveBeenCalledWith(
      'topic-list-1',
      TAXONOMY_KIND.TOPICS,
      tenant,
    );
  });

  it('maps each entry through buildHref and formatPostCount, then renders it as a card', async () => {
    getTaxonomyListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Browse by topic',
          supportingText: undefined,
          align: undefined,
        },
        layout: undefined,
        entries: [
          {
            id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Posts about building things.',
            postCount: 5,
          },
        ],
      },
    });

    await setup();

    const link = screen.getByRole('link', { name: /Engineering/ });
    expect(link).toHaveAttribute('href', '/topics/engineering');
    expect(screen.getByText('5 posts')).toBeVisible();
  });

  it('renders the given emptyMessage when entries is empty', async () => {
    getTaxonomyListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Browse by topic',
          supportingText: undefined,
          align: undefined,
        },
        layout: undefined,
        entries: [],
      },
    });

    await setup();

    expect(screen.getByText('No topics yet.')).toBeVisible();
  });
});
