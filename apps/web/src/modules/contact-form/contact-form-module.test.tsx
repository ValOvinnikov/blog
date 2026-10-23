import { ACTION_OUTCOME } from '@blog/config';
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
import { mockContactFormModule } from '@web/testing/modules/contact-form/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const HEADING = faker.company.catchPhrase();
const TENANT_ID = faker.string.uuid();
const PAGE_ID = faker.string.uuid();
const PATHNAME = `/${faker.lorem.slug()}`;
const NAME = faker.person.fullName();
const EMAIL = faker.internet.email();
const MESSAGE = faker.lorem.sentences(2);

const setup = customRenderAsync(ContactFormModule, {
  id: faker.string.uuid(),
});

const SUBMIT_LABEL = 'Send message';

describe(`<${ContactFormModule.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
    } as never);
    vi.mocked(usePathname).mockReturnValue(PATHNAME);
    vi.mocked(submitContactMessage).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getContactFormMock.mockResolvedValue(
      okResult(
        mockContactFormModule({
          headingBlock: mockHeadingBlock({ heading: HEADING }),
        }),
      ),
    );
  });

  it('renders the heading and the form', async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: HEADING });
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });
    expect(heading).toBeVisible();
    expect(submitButton).toBeVisible();
  });

  it.each<[string, TModuleComponentProps['context']]>([
    ['home page', { homePage: { id: PAGE_ID } }],
    ['landing page', { landingPage: { id: PAGE_ID, path: PATHNAME } }],
  ])(
    "sends the message with the %s's document id and locale",
    async (_, context) => {
      await setup({ context });

      await fillAndSendContactForm(userEvent.setup(), {
        name: NAME,
        email: EMAIL,
        message: MESSAGE,
      });

      expect(submitContactMessage).toHaveBeenCalledWith(
        {
          name: NAME,
          email: EMAIL,
          message: MESSAGE,
          website: '',
          sourcePath: PATHNAME,
        },
        {
          sourceDocumentId: PAGE_ID,
          sourceLocale: MOCK_REQUEST_CONTEXT.locale,
        },
      );
    },
  );

  it('renders nothing when the contact form capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    await setup();

    const submitButton = screen.queryByRole('button', { name: SUBMIT_LABEL });
    expect(submitButton).not.toBeInTheDocument();
    expect(getContactFormMock).not.toHaveBeenCalled();
  });

  it('renders nothing for a suspended tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.SUSPENDED,
      deprovisionedAt: null,
    } as never);

    await setup();

    const submitButton = screen.queryByRole('button', { name: SUBMIT_LABEL });
    expect(submitButton).not.toBeInTheDocument();
  });

  it('renders nothing when the module cannot be loaded', async () => {
    getContactFormMock.mockResolvedValue(
      errorResult(new Error('contact form unavailable')),
    );

    await setup();

    const heading = screen.queryByRole('heading', { name: HEADING });
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
