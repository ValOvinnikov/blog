import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_HERO_PROFILE_AVATAR_NAME,
  MOCK_HERO_PROFILE_MODULE_ID,
} from '@web/testing/modules/hero-profile/fixtures';
import { MOCK_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSocialProfile } from '@web/testing/shared/social-profile/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroProfileModule } from './hero-profile-module';

const HEADLINE = "Hi, I'm Jane";
const GITHUB_PROFILE = mockSocialProfile();

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

const mockHeroProfileData = (
  overrides: Partial<THeroProfileModule> = {},
): THeroProfileModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: mockHeadingBlock({ heading: HEADLINE }),
  avatarName: MOCK_HERO_PROFILE_AVATAR_NAME,
  bio: undefined,
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
  id: MOCK_HERO_PROFILE_MODULE_ID,
});

describe(`<${HeroProfileModule.name}/>`, () => {
  beforeEach(() => {
    getHeroProfileMock.mockReset();
    getHeroProfileMock.mockResolvedValue(okResult(mockHeroProfileData()));
  });

  describe('with the default module data', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module with the resolved tenant Sanity context', () => {
      expect(getHeroProfileMock).toHaveBeenCalledWith(
        MOCK_HERO_PROFILE_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved heading', () => {
      const heading = screen.getByRole('heading', { level: 1, name: HEADLINE });
      expect(heading).toBeVisible();
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroProfileMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('serves the hero image from the configured Sanity CDN', async () => {
    const sanityImage = mockSanityImage();
    getHeroProfileMock.mockResolvedValue(
      okResult(mockHeroProfileData({ sanityImage })),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });
    expect(
      image.getAttribute('src')?.startsWith(MOCK_SANITY_IMAGE_BASE_URL),
    ).toBe(true);
  });

  it('renders the resolved social links in a labelled list', async () => {
    getHeroProfileMock.mockResolvedValue(
      okResult(mockHeroProfileData({ socialLinks: [GITHUB_PROFILE] })),
    );

    await setup();

    const list = screen.getByRole('list', { name: 'Profiles' });
    const link = within(list).getByRole('link', { name: 'GitHub profile' });
    expect(link).toHaveAttribute('href', GITHUB_PROFILE.link.href);
  });
});
