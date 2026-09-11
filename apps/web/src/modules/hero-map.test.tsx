import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroSlot } from './hero-slot';

const {
  getHeroMock,
  getHeroBlogMock,
  getHeroStatementMock,
  getTenantSanityContextMock,
} = vi.hoisted(() => ({
  getHeroMock: vi.fn(),
  getHeroBlogMock: vi.fn(),
  getHeroStatementMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      hero: { v1: { getHero: getHeroMock } },
      heroBlog: { v1: { getHeroBlog: getHeroBlogMock } },
      heroStatement: { v1: { getHeroStatement: getHeroStatementMock } },
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
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        variant: HERO_VARIANT.SPLIT,
        eyebrow: undefined,
        heading: 'Featured this week',
        supportingText: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        contentPosition: undefined,
        contentAlignment: undefined,
        mediaOrder: undefined,
        layout: undefined,
      },
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
        heading: 'Build faster, ship sooner',
        supportingText: undefined,
        sanityImage: undefined,
        actions: undefined,
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
});
