import { SITE_MESSAGES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_GITHUB_PROFILE_LINK_NAME,
  MOCK_HERO_PROFILE_HEADING,
  MOCK_HERO_PROFILE_MODULE_ID,
  mockHeroProfileModule,
} from '@web/testing/modules/hero-profile/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSocialProfile } from '@web/testing/shared/social-profile/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroProfileModule } from './hero-profile-module';

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

const MOCK_GITHUB_PROFILE = mockSocialProfile();

const setup = customRenderAsync(HeroProfileModule, {
  id: MOCK_HERO_PROFILE_MODULE_ID,
});

describe(`<${HeroProfileModule.name}/>`, () => {
  beforeEach(() => {
    getHeroProfileMock.mockReset();
    getHeroProfileMock.mockResolvedValue(okResult(mockHeroProfileModule()));
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
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_HERO_PROFILE_HEADING,
      });

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
      okResult(mockHeroProfileModule({ sanityImage })),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });
    const imageSource = image.getAttribute('src');

    expect(imageSource?.startsWith(STATIC_SANITY_IMAGE_BASE_URL)).toBe(true);
  });

  it('renders the resolved social links in a labelled list', async () => {
    getHeroProfileMock.mockResolvedValue(
      okResult(mockHeroProfileModule({ socialLinks: [MOCK_GITHUB_PROFILE] })),
    );

    await setup();

    const list = screen.getByRole('list', {
      name: SITE_MESSAGES.socialLinks.listAriaLabel,
    });
    const link = within(list).getByRole('link', {
      name: MOCK_GITHUB_PROFILE_LINK_NAME,
    });

    expect(link).toHaveAttribute('href', MOCK_GITHUB_PROFILE.link.href);
  });
});
