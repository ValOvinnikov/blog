import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
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

vi.mock('@blog/db', () => ({
  TENANT_STATUS: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' },
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

vi.mock('@web/utils/logger/logger');

const HEADING = faker.company.catchPhrase();
const TENANT_ID = faker.string.uuid();

const setup = customRenderAsync(ContactFormModule, {
  id: faker.string.uuid(),
});

describe(`<${ContactFormModule.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: 'ACTIVE',
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
    expect(screen.getByRole('button', { name: 'Send message' })).toBeVisible();
  });

  it('renders nothing when the contact form capability is off', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Send message' }),
    ).not.toBeInTheDocument();
    expect(getContactFormMock).not.toHaveBeenCalled();
  });

  it('renders nothing for a suspended tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: TENANT_ID,
      status: 'SUSPENDED',
      deprovisionedAt: null,
    } as never);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Send message' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the module cannot be loaded', async () => {
    getContactFormMock.mockResolvedValue({ ok: false, error: 'NOT_FOUND' });

    await setup();

    expect(
      screen.queryByRole('heading', { name: HEADING }),
    ).not.toBeInTheDocument();
  });
});
