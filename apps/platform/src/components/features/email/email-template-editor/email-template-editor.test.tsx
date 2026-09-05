import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { EmailTemplateEditor } from './email-template-editor';

const render = renderWithIntl;

const { updateEmailTemplateActionMock } = vi.hoisted(() => ({
  updateEmailTemplateActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/email-templates/update-email-template-action',
  () => ({
    updateEmailTemplateAction: updateEmailTemplateActionMock,
  }),
);

vi.mock('@platform/server/email/upload-email-logo-action', () => ({
  uploadEmailLogoAction: vi.fn(),
}));

vi.mock('@platform/server/email/clear-email-logo-action', () => ({
  clearEmailLogoAction: vi.fn(),
}));

const BRAND: TTenantEmailBrand = {
  surface: '#ffffff',
  surface2: '#fbfbfd',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#6b7280',
  brandPrimary: '#4f46e5',
  brandPrimarySolid: '#4338ca',
  brandPrimaryContrast: '#ffffff',
  logo1: '#4f46e5',
  logo2: '#818cf8',
  logo3: '#c7d2fe',
};

const BODY_WITH_TEXT = [
  {
    _type: 'block' as const,
    _key: 'k1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text: 'Hello there', marks: [] }],
    markDefs: [],
  },
];

describe(EmailTemplateEditor, () => {
  beforeEach(() => {
    updateEmailTemplateActionMock.mockReset();
    updateEmailTemplateActionMock.mockResolvedValue({
      ok: true,
      result: {
        tenantId: 'tenant-1',
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        subject: 'Sign in',
        body: BODY_WITH_TEXT,
        logoAssetUrl: undefined,
      },
    });
  });

  it('renders the given subject and template label', () => {
    render(
      <EmailTemplateEditor
        tenantId="tenant-1"
        templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
        initialValues={{
          subject: 'Sign in to Acme Co',
          body: BODY_WITH_TEXT,
          logoAssetUrl: undefined,
        }}
        brand={BRAND}
        brandName="Acme Co"
      />,
    );

    expect(screen.getByDisplayValue('Sign in to Acme Co')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sign-in link' }),
    ).toBeInTheDocument();
  });

  it('states that the locked action always renders and cannot be edited here', () => {
    render(
      <EmailTemplateEditor
        tenantId="tenant-1"
        templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
        initialValues={{
          subject: 'Sign in',
          body: BODY_WITH_TEXT,
          logoAssetUrl: undefined,
        }}
        brand={BRAND}
        brandName="Acme Co"
      />,
    );

    expect(
      screen.getByText(/always renders and can't be edited here/),
    ).toBeInTheDocument();
  });

  it('saves an edited subject as-is', async () => {
    render(
      <EmailTemplateEditor
        tenantId="tenant-1"
        templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
        initialValues={{
          subject: 'Sign in',
          body: BODY_WITH_TEXT,
          logoAssetUrl: undefined,
        }}
        brand={BRAND}
        brandName="Acme Co"
      />,
    );

    const user = userEvent.setup();
    const subjectInput = screen.getByDisplayValue('Sign in');
    await user.clear(subjectInput);
    await user.type(subjectInput, 'Please sign in');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        expect.objectContaining({ subject: 'Please sign in' }),
      );
    });
  });

  it('sends null, not an empty string, when the subject is cleared', async () => {
    render(
      <EmailTemplateEditor
        tenantId="tenant-1"
        templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
        initialValues={{
          subject: 'Sign in',
          body: BODY_WITH_TEXT,
          logoAssetUrl: undefined,
        }}
        brand={BRAND}
        brandName="Acme Co"
      />,
    );

    const user = userEvent.setup();
    await user.clear(screen.getByDisplayValue('Sign in'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        expect.objectContaining({ subject: null }),
      );
    });
  });

  it('sends null for a body that is blank (a single empty default paragraph)', async () => {
    render(
      <EmailTemplateEditor
        tenantId="tenant-1"
        templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
        initialValues={{
          subject: 'Sign in',
          body: [],
          logoAssetUrl: undefined,
        }}
        brand={BRAND}
        brandName="Acme Co"
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        expect.objectContaining({ body: null }),
      );
    });
  });
});
