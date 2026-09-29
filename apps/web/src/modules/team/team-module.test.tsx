import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TeamModule } from './team-module';

const { getTeamModuleMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTeamModuleMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      team: { v1: { getTeamModule: getTeamModuleMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Meet the team' }),
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  showBios: false,
  showSocialLinks: false,
  layout: undefined,
};

const setup = customRenderAsync(TeamModule, {
  id: 'team-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TeamModule.name}/>`, () => {
  beforeEach(() => {
    getTeamModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getTeamModule with the module id and the tenant Sanity context resolved from the tenant slug', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getTeamModuleMock.mockResolvedValue({
      ok: true,
      data: {
        ...baseModule,
        members: [
          makeTeamMember({ id: 'team-member-1' }),
          makeTeamMember({ id: 'team-member-2' }),
        ],
      },
    });

    await setup();

    expect(getTeamModuleMock).toHaveBeenCalledWith('team-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getTeamModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved team member cards', async () => {
    const members = [
      makeTeamMember({ id: 'team-member-1' }),
      makeTeamMember({ id: 'team-member-2' }),
    ];
    getTeamModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, members },
    });

    await setup();

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
