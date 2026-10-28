import { CAPABILITY } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockNewsletterModule,
} from '@web/testing/modules/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_SUSPENDED_TENANT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { NewsletterModule } from './newsletter-module';

const { getNewsletterMock } = vi.hoisted(() => ({
  getNewsletterMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      newsletter: { v1: { getNewsletter: getNewsletterMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

vi.mock(
  '@web/components/shared/newsletter-subscribed-gate/hooks/use-is-reader-subscribed',
);

faker.seed(6011);

const MOCK_FIRST_CUE = faker.lorem.words(2);
const MOCK_SECOND_CUE = faker.lorem.words(3);

const setup = customRenderAsync(NewsletterModule, {
  id: MOCK_NEWSLETTER_MODULE_ID,
});

describe(`<${NewsletterModule.name}/>`, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
    vi.mocked(isCapabilityEnabled).mockReset();
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
  });

  it("renders the module's own trust cues in the form", async () => {
    getNewsletterMock.mockResolvedValue(
      okResult(
        mockNewsletterModule({ trustCues: [MOCK_FIRST_CUE, MOCK_SECOND_CUE] }),
      ),
    );

    await setup();

    const firstCue = screen.getByText(MOCK_FIRST_CUE);
    const secondCue = screen.getByText(MOCK_SECOND_CUE);

    expect(firstCue).toBeVisible();
    expect(secondCue).toBeVisible();
  });

  it.each<[string, () => void]>([
    [
      'the NEWSLETTER capability is off',
      () => vi.mocked(isCapabilityEnabled).mockResolvedValue(false),
    ],
    [
      'the site is suspended',
      () =>
        vi
          .mocked(resolveRequestTenant)
          .mockResolvedValueOnce(MOCK_SUSPENDED_TENANT),
    ],
  ])('renders nothing, without fetching, when %s', async (_, arrange) => {
    arrange();

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterMock).not.toHaveBeenCalled();
  });

  describe('when the newsletter fetch fails', () => {
    let container: HTMLElement;

    beforeEach(async () => {
      getNewsletterMock.mockResolvedValue(errorResult(MOCK_ERROR));
      ({ container } = await setup());
    });

    it('renders nothing', () => {
      expect(container).toBeEmptyDOMElement();
    });

    it('fetches the module with the resolved tenant Sanity context', () => {
      expect(getNewsletterMock).toHaveBeenCalledWith(
        MOCK_NEWSLETTER_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('checks the NEWSLETTER capability', () => {
      expect(isCapabilityEnabled).toHaveBeenCalledWith(CAPABILITY.NEWSLETTER);
    });
  });
});
