import { ACTION_OUTCOME, SITE_MESSAGES } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { submitContactMessage } from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { fillAndSendContactForm } from '@web/testing/modules/contact-form/contact-form-fields';
import {
  MOCK_CONTACT_MESSAGE,
  mockContactFormModule,
} from '@web/testing/modules/contact-form/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  mockTenant,
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

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual('@blog/db/constants')),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: vi.fn() }),
);

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));

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
    vi.mocked(resolveRequestTenant).mockResolvedValue(mockTenant());
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

  it('renders nothing when the contact form capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    await setup();

    const submitButton = screen.queryByRole('button', { name: submitLabel });
    expect(submitButton).not.toBeInTheDocument();
    expect(getContactFormMock).not.toHaveBeenCalled();
  });

  it('renders nothing for a suspended tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(
      mockTenant({ status: TENANT_STATUS.SUSPENDED }),
    );

    await setup();

    const submitButton = screen.queryByRole('button', { name: submitLabel });
    expect(submitButton).not.toBeInTheDocument();
  });

  it('renders nothing when the module cannot be loaded', async () => {
    getContactFormMock.mockResolvedValue(
      errorResult(new Error('contact form unavailable')),
    );

    await setup();

    const heading = screen.queryByRole('heading', { name: MOCK_HEADING });
    expect(heading).not.toBeInTheDocument();
  });

  it.each([
    {
      route: 'a resolved tenant',
      tenantId: MOCK_REQUEST_CONTEXT.tenantId,
      expected: MOCK_REQUEST_CONTEXT.tenantId,
    },
    {
      route: 'no tenant',
      tenantId: undefined,
      expected: UNRESOLVED_TENANT_PLACEHOLDER,
    },
  ])(
    'resolves the expected tenant when the route found $route',
    async ({ tenantId, expected }) => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        tenantId,
      });

      await setup();

      expect(resolveRequestTenant).toHaveBeenCalledWith(expected);
    },
  );
});
