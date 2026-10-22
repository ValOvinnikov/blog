import { TENANT_STATUS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeContactFormModule } from '@web/testing/modules/contact-form/fixtures';
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
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
    } as never);
    getContactFormMock.mockResolvedValue({
      ok: true,
      data: makeContactFormModule({
        headingBlock: makeHeadingBlock({ heading: HEADING }),
      }),
    });
  });

  it('renders the heading and the form', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: HEADING })).toBeVisible();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeVisible();
  });

  it('renders nothing when the contact form capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    await setup();

    expect(
      screen.queryByRole('button', { name: SUBMIT_LABEL }),
    ).not.toBeInTheDocument();
    expect(getContactFormMock).not.toHaveBeenCalled();
  });

  it('renders nothing for a suspended tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.SUSPENDED,
      deprovisionedAt: null,
    } as never);

    await setup();

    expect(
      screen.queryByRole('button', { name: SUBMIT_LABEL }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the module cannot be loaded', async () => {
    getContactFormMock.mockResolvedValue({
      ok: false,
      error: new Error('contact form unavailable'),
    });

    await setup();

    expect(
      screen.queryByRole('heading', { name: HEADING }),
    ).not.toBeInTheDocument();
  });

  it("resolves the request context's tenant", async () => {
    await setup();

    expect(resolveRequestTenant).toHaveBeenCalledWith(
      DEFAULT_REQUEST_CONTEXT.tenantId,
    );
  });

  it('reads no tenant from the request headers when the route resolved no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await setup();

    expect(resolveRequestTenant).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });
});
