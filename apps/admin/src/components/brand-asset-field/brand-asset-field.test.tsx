import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const render = renderWithIntl;

const { uploadBrandAssetActionMock, clearBrandAssetActionMock } = vi.hoisted(
  () => ({
    uploadBrandAssetActionMock: vi.fn(),
    clearBrandAssetActionMock: vi.fn(),
  }),
);

vi.mock('@admin/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: uploadBrandAssetActionMock,
}));

vi.mock('@admin/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: clearBrandAssetActionMock,
}));

// `applyAccept: false` bypasses user-event's own `accept`-attribute
// filtering — real browsers already enforce that at the file picker, so
// this simulates the one path that can still reach the handler with a
// mismatched type (e.g. drag-and-drop), which `quickClientImageCheck`
// exists to catch.
function selectFile(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  const user = userEvent.setup({ applyAccept: false });
  return user.upload(input, file);
}

describe(BrandAssetField, () => {
  beforeEach(() => {
    uploadBrandAssetActionMock.mockReset();
    clearBrandAssetActionMock.mockReset();
  });

  it('shows the pre-selection square requirement in its hint before any file is chosen', () => {
    render(
      <BrandAssetField
        tenantSlug="acme"
        kind="favicon"
        label="Favicon"
        hint="Pre-cropped square, please — non-square uploads are rejected."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Pre-cropped square, please/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeInTheDocument();
  });

  it('renders a thumbnail and a Remove control once a value is set', () => {
    render(
      <BrandAssetField
        tenantSlug="acme"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl="https://example.blob.vercel-storage.com/logo.png"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByAltText('Current logo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Replace logo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('uploads a chosen file and reports the saved URL back through onChange', async () => {
    uploadBrandAssetActionMock.mockResolvedValue({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/logo-new.png',
    });
    const onChange = vi.fn();
    const { container } = render(
      <BrandAssetField
        tenantSlug="acme"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl={undefined}
        onChange={onChange}
      />,
    );

    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    await selectFile(container, file);

    await waitFor(() => {
      expect(uploadBrandAssetActionMock).toHaveBeenCalledWith(
        'acme',
        'logo',
        expect.any(FormData),
      );
    });
    expect(onChange).toHaveBeenCalledWith(
      'https://example.blob.vercel-storage.com/logo-new.png',
    );
  });

  it('rejects an obviously wrong file client-side without ever calling the upload action', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <BrandAssetField
        tenantSlug="acme"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl={undefined}
        onChange={onChange}
      />,
    );

    const file = new File(['bytes'], 'logo.svg', { type: 'image/svg+xml' });
    await selectFile(container, file);

    expect(
      await screen.findByText('Choose a PNG, JPEG, or WebP image.'),
    ).toBeInTheDocument();
    expect(uploadBrandAssetActionMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the server error and keeps the previous value when the upload fails', async () => {
    uploadBrandAssetActionMock.mockResolvedValue({
      ok: false,
      error: 'Favicon must be a square image — this one is 300×80px.',
    });
    const onChange = vi.fn();
    const { container } = render(
      <BrandAssetField
        tenantSlug="acme"
        kind="favicon"
        label="Favicon"
        hint="Pre-cropped square, please."
        currentUrl="https://example.blob.vercel-storage.com/favicon.png"
        onChange={onChange}
      />,
    );

    const file = new File(['bytes'], 'favicon.png', { type: 'image/png' });
    await selectFile(container, file);

    expect(
      await screen.findByText(/Favicon must be a square image/),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByAltText('Current favicon')).toBeInTheDocument();
  });

  it('shows a readable fallback error, without crashing, when the action call itself throws (e.g. a body-size rejection)', async () => {
    uploadBrandAssetActionMock.mockRejectedValue(
      new Error('Body exceeded 1mb limit'),
    );
    const onChange = vi.fn();
    const { container } = render(
      <BrandAssetField
        tenantSlug="acme"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl="https://example.blob.vercel-storage.com/logo.png"
        onChange={onChange}
      />,
    );

    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    await selectFile(container, file);

    expect(
      await screen.findByText('Something went wrong — try again.'),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByAltText('Current logo')).toBeInTheDocument();
  });

  it('clears the saved value through the clear action when Remove is clicked', async () => {
    clearBrandAssetActionMock.mockResolvedValue({ ok: true });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandAssetField
        tenantSlug="acme"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl="https://example.blob.vercel-storage.com/logo.png"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(clearBrandAssetActionMock).toHaveBeenCalledWith('acme', 'logo');
    });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
