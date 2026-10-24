import { CAPABILITY } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockNewsletterModule,
} from '@web/testing/modules/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

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
    const firstCue = faker.lorem.words(2);
    const secondCue = faker.lorem.words(3);
    getNewsletterMock.mockResolvedValue(
      okResult(mockNewsletterModule({ trustCues: [firstCue, secondCue] })),
    );

    await setup();

    const firstCueElement = screen.getByText(firstCue);
    const secondCueElement = screen.getByText(secondCue);
    expect(firstCueElement).toBeVisible();
    expect(secondCueElement).toBeVisible();
  });

  it('renders nothing, without fetching, when the NEWSLETTER capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

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
