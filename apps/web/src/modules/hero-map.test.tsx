import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { PageIntro } from '@web/components/shared/page-intro';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  makeHeroBlogData,
  makeStaleUnresolvedHeroBlogData,
  makeUnresolvedHeroBlogData,
} from '@web/testing/modules/hero-blog/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroSlot } from './hero-slot';

const {
  getHeroMock,
  getHeroBlogMock,
  getHeroStatementMock,
  getHeroProfileMock,
  getTenantSanityContextMock,
} = vi.hoisted(() => ({
  getHeroMock: vi.fn(),
  getHeroBlogMock: vi.fn(),
  getHeroStatementMock: vi.fn(),
  getHeroProfileMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      hero: { v1: { getHero: getHeroMock } },
      heroBlog: { v1: { getHeroBlog: getHeroBlogMock } },
      heroStatement: { v1: { getHeroStatement: getHeroStatementMock } },
      heroProfile: { v1: { getHeroProfile: getHeroProfileMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const setup = customRenderAsync(HeroSlot, {
  id: 'hero-1',
  type: 'module_hero',
  locale: 'en',
  tenant: 'tenant-1',
});

describe('HERO_MAP', () => {
  beforeEach(() => {
    getHeroMock.mockReset();
    getHeroBlogMock.mockReset();
    getHeroStatementMock.mockReset();
    getHeroProfileMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('dispatches module_hero through the real registry to the real HeroModule', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: 'Welcome',
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    await setup();

    expect(getHeroMock).toHaveBeenCalledWith(
      'hero-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeVisible();
  });

  it('dispatches module_heroBlog through the real registry to the real HeroBlogModule', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ heading: 'Featured this week' }),
    });

    await setup({ id: 'hero-blog-1', type: 'module_heroBlog' });

    expect(getHeroBlogMock).toHaveBeenCalledWith(
      'hero-blog-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Featured this week' }),
    ).toBeVisible();
  });

  it('dispatches module_heroStatement through the real registry to the real HeroStatementModule', async () => {
    getHeroStatementMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        variant: HERO_VARIANT.SPLIT,
        eyebrow: undefined,
        headingBlock: makeHeadingBlock({
          heading: 'Build faster, ship sooner',
        }),
        sanityImage: undefined,
        ctaButtons: [],
        contentPosition: undefined,
        contentAlignment: undefined,
        mediaOrder: undefined,
        layout: undefined,
      },
    });

    await setup({ id: 'hero-statement-1', type: 'module_heroStatement' });

    expect(getHeroStatementMock).toHaveBeenCalledWith(
      'hero-statement-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Build faster, ship sooner',
      }),
    ).toBeVisible();
  });

  it('dispatches module_heroProfile through the real registry to the real HeroProfileModule', async () => {
    getHeroProfileMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        variant: HERO_VARIANT.STACKED,
        eyebrow: undefined,
        headingBlock: makeHeadingBlock({ heading: 'Jane Doe' }),
        sanityImage: undefined,
        socialLinks: [],
        ctaButtons: [],
        contentPosition: undefined,
        contentAlignment: undefined,
        mediaOrder: undefined,
        layout: undefined,
      },
    });

    await setup({ id: 'hero-profile-1', type: 'module_heroProfile' });

    expect(getHeroProfileMock).toHaveBeenCalledWith(
      'hero-profile-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Jane Doe' }),
    ).toBeVisible();
  });

  it('dispatches module_heroBlog through the real registry to nothing, and logs, when no post resolves', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeUnresolvedHeroBlogData(),
    });

    const { container } = await setup({
      id: 'hero-blog-1',
      type: 'module_heroBlog',
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to the page heading, as the sole h1, when a page composes a Blog Hero that hides because no post resolved', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeStaleUnresolvedHeroBlogData(
        'Stale hero title left over from an unpublished post',
      ),
    });

    const setupPageIntro = customRenderAsync(PageIntro, {
      hero: { id: 'hero-blog-1', type: 'module_heroBlog' },
      headingBlock: makeHeadingBlock({ heading: 'Notes on building things' }),
      locale: 'en',
      tenant: 'tenant-1',
    });

    await setupPageIntro();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Notes on building things',
      }),
    ).toBeVisible();
  });
});
