import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import type { TTimelineModule } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TIMELINE_HEADING,
  mockTimelineItem,
} from '@web/testing/modules/timeline/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

vi.mock('@web/server/request-context/request-context');

faker.seed(22);

const MOCK_MODULE_ID = faker.string.uuid();
const MOCK_FIRST_HEADING = faker.lorem.words(2);
const MOCK_SECOND_HEADING = faker.lorem.words(3);

const mockTimelineModule = (
  overrides: Partial<TTimelineModule> = {},
): TTimelineModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TIMELINE_HEADING }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  items: [],
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(TimelineModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${TimelineModule.name}/>`, () => {
  beforeEach(() => {
    getTimelineModuleMock.mockReset();
    getTimelineModuleMock.mockResolvedValue(okResult(mockTimelineModule()));
  });

  it('fetches the module with the tenant Sanity context', async () => {
    await setup();

    expect(getTimelineModuleMock).toHaveBeenCalledWith(
      MOCK_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getTimelineModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved items as headings', async () => {
    getTimelineModuleMock.mockResolvedValue(
      okResult(
        mockTimelineModule({
          items: [
            mockTimelineItem({
              id: faker.string.uuid(),
              heading: MOCK_FIRST_HEADING,
            }),
            mockTimelineItem({
              id: faker.string.uuid(),
              heading: MOCK_SECOND_HEADING,
            }),
          ],
        }),
      ),
    );

    await setup();

    const firstHeading = screen.getByRole('heading', {
      name: MOCK_FIRST_HEADING,
    });
    const secondHeading = screen.getByRole('heading', {
      name: MOCK_SECOND_HEADING,
    });

    expect(firstHeading).toBeVisible();
    expect(secondHeading).toBeVisible();
  });
});
