import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TIMELINE_HEADING,
  mockTimelineItem,
} from '@web/testing/modules/timeline/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TimelineModule } from './timeline-module';

const MODULE_ID = 'timeline-1';

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

vi.mock('@web/server/request-context/request-context');

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_TIMELINE_HEADING }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(TimelineModule, {
  id: MODULE_ID,
});

describe(`<${TimelineModule.name}/>`, () => {
  beforeEach(() => {
    getTimelineModuleMock.mockReset();
  });

  it('fetches the module with the tenant Sanity context', async () => {
    getTimelineModuleMock.mockResolvedValue(
      okResult({ ...baseModule, items: [] }),
    );

    await setup();

    expect(getTimelineModuleMock).toHaveBeenCalledWith(
      MODULE_ID,
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getTimelineModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved items as headings', async () => {
    getTimelineModuleMock.mockResolvedValue(
      okResult({
        ...baseModule,
        items: [
          mockTimelineItem({ id: 'a', heading: 'Kick-off' }),
          mockTimelineItem({ id: 'b', heading: 'Delivery' }),
        ],
      }),
    );

    await setup();

    const firstHeading = screen.getByRole('heading', { name: 'Kick-off' });
    const secondHeading = screen.getByRole('heading', { name: 'Delivery' });
    expect(firstHeading).toBeVisible();
    expect(secondHeading).toBeVisible();
  });
});
