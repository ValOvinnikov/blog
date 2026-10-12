import { NEWSLETTER_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeNewsletterModule } from '@web/testing/modules/newsletter/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(NewsletterModule, {
  id: 'newsletter-1',
});

describe(`<${NewsletterModule.name}/>`, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
    vi.mocked(isCapabilityEnabled).mockReset();
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it("renders the module's own trust cues in the form", async () => {
    const firstCue = faker.lorem.words(2);
    const secondCue = faker.lorem.words(3);
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: makeNewsletterModule({ trustCues: [firstCue, secondCue] }),
    });

    await setup();

    expect(screen.getByText(firstCue)).toBeVisible();
    expect(screen.getByText(secondCue)).toBeVisible();
  });

  it('renders the compact form (no supporting text) for a COMPACT module', async () => {
    const heading = faker.company.catchPhrase();
    const supportingText = faker.lorem.sentence();
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: makeNewsletterModule({
        headingBlock: makeHeadingBlock({ heading, supportingText }),
        variant: NEWSLETTER_VARIANT.COMPACT,
        trustCues: undefined,
      }),
    });

    await setup();

    expect(screen.getByText(heading)).toBeVisible();
    expect(screen.queryByText(supportingText)).not.toBeInTheDocument();
  });

  it('renders nothing, without fetching, when the NEWSLETTER capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getNewsletterMock).not.toHaveBeenCalled();
  });

  describe('when the newsletter fetch fails', () => {
    beforeEach(() => {
      getNewsletterMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });
    });

    it('renders nothing when the fetch fails', async () => {
      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });

    it('forwards the resolved tenant Sanity context to getNewsletter', async () => {
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

      expect(getNewsletterMock).toHaveBeenCalledWith('newsletter-1', tenant);
    });

    it('checks the NEWSLETTER capability', async () => {
      await setup();

      expect(isCapabilityEnabled).toHaveBeenCalledWith('NEWSLETTER');
    });
  });
});
