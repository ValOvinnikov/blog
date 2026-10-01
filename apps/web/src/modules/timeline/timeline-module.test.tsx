import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTimelineItem } from '@web/testing/modules/timeline/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TimelineModule } from './timeline-module';

const { getTimelineModuleMock } = vi.hoisted(() => ({
  getTimelineModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      timeline: { v1: { getTimelineModule: getTimelineModuleMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context');

const getTenantSanityContextMock = vi.mocked(getTenantSanityContext);

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'How we work' }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(TimelineModule, {
  id: 'timeline-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TimelineModule.name}/>`, () => {
  beforeEach(() => {
    getTimelineModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getTimelineModule with the module id and tenant context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getTimelineModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, items: [] },
    });

    await setup();

    expect(getTimelineModuleMock).toHaveBeenCalledWith('timeline-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1', 'en');
  });

  it('renders nothing when the fetch fails', async () => {
    getTimelineModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved items as headings', async () => {
    getTimelineModuleMock.mockResolvedValue({
      ok: true,
      data: {
        ...baseModule,
        items: [
          makeTimelineItem({ id: 'a', heading: 'Kick-off' }),
          makeTimelineItem({ id: 'b', heading: 'Delivery' }),
        ],
      },
    });

    await setup();

    expect(screen.getByRole('heading', { name: 'Kick-off' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeVisible();
  });
});
