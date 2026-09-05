import { renderWithIntl, screen } from '@platform/testing/custom-render';
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

const selectFile = (container: HTMLElement, file: File) => {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  const user = userEvent.setup({ applyAccept: false });
  return user.upload(input, file);
};

describe(EmailLogoField, () => {
  beforeEach(() => {
    uploadEmailLogoActionMock.mockReset();
    clearEmailLogoActionMock.mockReset();
  });

  it('shows an upload control and no thumbnail before any value is set', () => {
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

    expect(
      screen.getByRole('button', { name: 'Upload email logo' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument();
  });

  it('renders a thumbnail and a Remove control once a value is set', () => {
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
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('uploads a chosen file against the given target and reports the saved URL back through onChange', async () => {
    uploadEmailLogoActionMock.mockResolvedValue({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/email-logo-new.png',
    });
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
      new File(['x'], 'logo.png', { type: 'image/png' }),
    );

    expect(uploadEmailLogoActionMock).toHaveBeenCalledWith(
      'tenant-1',
      { type: 'tenant' },
      expect.any(FormData),
    );
    expect(onChange).toHaveBeenCalledWith(
      'https://example.blob.vercel-storage.com/email-logo-new.png',
    );
  });

  it('rejects an SVG before ever calling the upload action', async () => {
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
    expect(screen.getByText(/SVG/)).toBeInTheDocument();
  });

  it('clears the logo through its own action when Remove is clicked', async () => {
    clearEmailLogoActionMock.mockResolvedValue({ ok: true });
    const onChange = vi.fn();
    render(
      <EmailLogoField
        tenantId="tenant-1"
        target={{ type: 'template', templateType: 'MAGIC_LINK' }}
        label="Template logo"
        hint="PNG, JPEG, or GIF."
        currentUrl="https://example.blob.vercel-storage.com/email-logo-magic-link.png"
        onChange={onChange}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(clearEmailLogoActionMock).toHaveBeenCalledWith('tenant-1', {
      type: 'template',
      templateType: 'MAGIC_LINK',
    });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
