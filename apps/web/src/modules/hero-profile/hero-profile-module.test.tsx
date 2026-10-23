import { BRAND_VARIANT, HERO_VARIANT, SOCIAL_PLATFORMS } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroProfileModule } from './hero-profile-module';

const HEADLINE = "Hi, I'm Jane";
const MODULE_ID = 'hero-profile-1';
const GITHUB_URL = 'https://github.com/example';

const { getHeroProfileMock } = vi.hoisted(() => ({
  getHeroProfileMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroProfile: { v1: { getHeroProfile: getHeroProfileMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const makeHeroProfileData = (overrides: Record<string, unknown> = {}) => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: HEADLINE }),
  avatarName: 'Jamie Rivera',
  sanityImage: undefined,
  socialLinks: [],
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(HeroProfileModule, {
  id: MODULE_ID,
});

describe(`<${HeroProfileModule.name}/>`, () => {
  beforeEach(() => {
    getHeroProfileMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getHeroProfileMock.mockResolvedValue(okResult(makeHeroProfileData()));
  });

  it('forwards the resolved tenant Sanity context to getHeroProfile', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    await setup();

    expect(getHeroProfileMock).toHaveBeenCalledWith(MODULE_ID, tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroProfileMock.mockResolvedValue(errorResult(new Error('boom')));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: HEADLINE }),
    ).toBeVisible();
  });

  it('renders the hero image src from the configured Sanity CDN base URL', async () => {
    const sanityImage = makeSanityImage();
    getHeroProfileMock.mockResolvedValue(
      okResult(makeHeroProfileData({ sanityImage })),
    );

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(
      img.getAttribute('src')?.startsWith(STATIC_SANITY_IMAGE_BASE_URL),
    ).toBe(true);
  });

  it('renders no social links list when socialLinks is empty', async () => {
    getHeroProfileMock.mockResolvedValue(
      okResult(makeHeroProfileData({ socialLinks: [] })),
    );

    await setup();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a labelled list of social links with their targets and named icons', async () => {
    getHeroProfileMock.mockResolvedValue(
      okResult(
        makeHeroProfileData({
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: {
                label: 'GitHub',
                href: GITHUB_URL,
                target: '_blank',
                platform: undefined,
                ariaLabel: undefined,
              },
            },
          ],
        }),
      ),
    );

    await setup();

    const list = screen.getByRole('list', { name: 'Profiles' });
    const link = within(list).getByRole('link', { name: 'GitHub profile' });
    expect(link).toHaveAttribute('href', GITHUB_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.GITHUB}`),
    ).toBeVisible();
  });

  it('renders one list item per resolved social link', async () => {
    getHeroProfileMock.mockResolvedValue(
      okResult(
        makeHeroProfileData({
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: {
                label: 'GitHub',
                href: GITHUB_URL,
                target: '_blank',
                platform: undefined,
                ariaLabel: undefined,
              },
            },
            {
              platform: SOCIAL_PLATFORMS.X,
              link: {
                label: SOCIAL_PLATFORMS.X,
                href: 'https://x.com/example',
                target: '_blank',
                platform: undefined,
                ariaLabel: undefined,
              },
            },
            {
              platform: SOCIAL_PLATFORMS.LINKEDIN,
              link: {
                label: 'LinkedIn',
                href: 'https://linkedin.com/in/example',
                target: '_blank',
                platform: undefined,
                ariaLabel: undefined,
              },
            },
          ],
        }),
      ),
    );

    await setup();

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });
});
