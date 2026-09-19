import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import { EmailLogoField } from './email-logo-field';

const render = renderWithIntl;

const { uploadEmailLogoActionMock, clearEmailLogoActionMock } = vi.hoisted(
  () => ({
    uploadEmailLogoActionMock: vi.fn(),
    clearEmailLogoActionMock: vi.fn(),
  }),
);

vi.mock('@platform/server/email/upload-email-logo-action', () => ({
  uploadEmailLogoAction: uploadEmailLogoActionMock,
}));

vi.mock('@platform/server/email/clear-email-logo-action', () => ({
  clearEmailLogoAction: clearEmailLogoActionMock,
}));

describe(`<${EmailLogoField.name}/>`, () => {
  beforeEach(() => {
    uploadEmailLogoActionMock.mockReset();
    clearEmailLogoActionMock.mockReset();
  });

  it('shows the hint and the upload label before any value is set', () => {
    render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'tenant' }}
        label="Email logo"
        hint="PNG, JPEG, or GIF."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('PNG, JPEG, or GIF.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload email logo' }),
    ).toBeInTheDocument();
  });

  it('shows the current alt text and the replace label once a value is set', () => {
    render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'tenant' }}
        label="Email logo"
        hint="PNG, JPEG, or GIF."
        currentUrl="https://example.blob.vercel-storage.com/email-logo.png"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByAltText('Current email logo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Replace email logo' }),
    ).toBeInTheDocument();
  });

  it('translates an unsupported-type rejection before ever calling the upload action', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'tenant' }}
        label="Email logo"
        hint="PNG, JPEG, or GIF."
        currentUrl={undefined}
        onChange={onChange}
      />,
    );

    await selectFile(
      container,
      new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' }),
    );

    expect(uploadEmailLogoActionMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/SVG and WebP are not supported/)).toBeVisible();
  });

  it('forwards the tenantId and target to the upload action when a file is selected', async () => {
    uploadEmailLogoActionMock.mockResolvedValue({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/email-logo-new.png',
    });
    const { container } = render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'tenant' }}
        label="Email logo"
        hint="PNG, JPEG, or GIF."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );

    await selectFile(
      container,
      new File(['x'], 'logo.png', { type: 'image/png' }),
    );

    expect(uploadEmailLogoActionMock).toHaveBeenCalledWith(
      'tenant-1',
      { type: 'tenant' },
      expect.any(FormData),
    );
  });

  it('forwards the tenantId and target to the clear action when Remove is clicked', async () => {
    clearEmailLogoActionMock.mockResolvedValue({ ok: true });
    render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'template', templateType: 'MAGIC_LINK' }}
        label="Template logo"
        hint="PNG, JPEG, or GIF."
        currentUrl="https://example.blob.vercel-storage.com/email-logo-magic-link.png"
        onChange={vi.fn()}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Remove' }));

    expect(clearEmailLogoActionMock).toHaveBeenCalledWith('tenant-1', {
      type: 'template',
      templateType: 'MAGIC_LINK',
    });
  });
});
