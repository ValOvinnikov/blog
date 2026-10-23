import { TENANT_STATUS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockContactFormModule } from '@web/testing/modules/contact-form/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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
    getContactFormMock.mockResolvedValue(
      okResult(
        mockContactFormModule({
          headingBlock: makeHeadingBlock({ heading: HEADING }),
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
      tenantId: DEFAULT_REQUEST_CONTEXT.tenantId,
      expected: DEFAULT_REQUEST_CONTEXT.tenantId,
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
        ...DEFAULT_REQUEST_CONTEXT,
        tenantId,
      });

      await setup();

      expect(resolveRequestTenant).toHaveBeenCalledWith(expected);
    },
  );
});
