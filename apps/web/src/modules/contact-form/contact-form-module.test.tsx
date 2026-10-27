import { ACTION_OUTCOME, SITE_MESSAGES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { submitContactMessage } from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { fillAndSendContactForm } from '@web/testing/modules/contact-form/contact-form-fields';
import {
  MOCK_CONTACT_MESSAGE,
  mockContactFormModule,
} from '@web/testing/modules/contact-form/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_SUSPENDED_TENANT,
} from '@web/testing/shared/tenant/fixtures';

import { ContactFormModule } from './contact-form-module';

const { getContactFormMock } = vi.hoisted(() => ({
  getContactFormMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      contactForm: { v1: { getContactForm: getContactFormMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: vi.fn() }),
);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@web/server/contact-form/contact-form-actions/contact-form-actions',
  () => ({ submitContactMessage: vi.fn() }),
);

const MOCK_HEADING = faker.company.catchPhrase();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_PATHNAME = `/${faker.lorem.slug()}`;

const setup = customRenderAsync(ContactFormModule, {
  id: faker.string.uuid(),
});

const { submitLabel } = SITE_MESSAGES.contactForm;

describe(`<${ContactFormModule.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    vi.mocked(usePathname).mockReturnValue(MOCK_PATHNAME);
    vi.mocked(submitContactMessage).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getContactFormMock.mockResolvedValue(
      okResult(
        mockContactFormModule({
          headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
        }),
      ),
    );
  });

  it('renders the heading and the form', async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });
    const submitButton = screen.getByRole('button', { name: submitLabel });
    expect(heading).toBeVisible();
    expect(submitButton).toBeVisible();
  });

  it.each<[string, TModuleComponentProps['context']]>([
    ['home page', { homePage: { id: MOCK_PAGE_ID } }],
    [
      'landing page',
      { landingPage: { id: MOCK_PAGE_ID, path: MOCK_PATHNAME } },
    ],
  ])(
    "sends the message with the %s's document id and locale",
    async (_, context) => {
      await setup({ context });

      await fillAndSendContactForm(userEvent.setup(), MOCK_CONTACT_MESSAGE);

      expect(submitContactMessage).toHaveBeenCalledWith(
        {
          ...MOCK_CONTACT_MESSAGE,
          website: '',
          sourcePath: MOCK_PATHNAME,
        },
        {
          sourceDocumentId: MOCK_PAGE_ID,
          sourceLocale: MOCK_REQUEST_CONTEXT.locale,
        },
      );
    },
  );

  it.each<[string, () => void]>([
    [
      'the contact form capability is off',
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

    await setup();

    const submitButton = screen.queryByRole('button', { name: submitLabel });
    expect(submitButton).not.toBeInTheDocument();
    expect(getContactFormMock).not.toHaveBeenCalled();
  });

  it('renders nothing when the module cannot be loaded', async () => {
    getContactFormMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await setup();

    const heading = screen.queryByRole('heading', { name: MOCK_HEADING });
    expect(heading).not.toBeInTheDocument();
  });
});
