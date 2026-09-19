import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const render = renderWithIntl;

const { uploadBrandAssetActionMock, clearBrandAssetActionMock } = vi.hoisted(
  () => ({
    uploadBrandAssetActionMock: vi.fn(),
    clearBrandAssetActionMock: vi.fn(),
  }),
);

vi.mock('@platform/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: uploadBrandAssetActionMock,
}));

vi.mock('@platform/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: clearBrandAssetActionMock,
}));

describe(`<${BrandAssetField.name}/>`, () => {
  beforeEach(() => {
    uploadBrandAssetActionMock.mockReset();
    clearBrandAssetActionMock.mockReset();
  });

  it('shows the hint and the label for the given kind before any file is chosen', () => {
    render(
      <BrandAssetField
        tenantId="tenant-1"
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

  it('shows the current alt text and the replace label once a value is set', () => {
    render(
      <BrandAssetField
        tenantId="tenant-1"
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
  });

  it('sizes the thumb differently for a favicon than for a logo', () => {
    const { container: logoContainer } = render(
      <BrandAssetField
        tenantId="tenant-1"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );
    expect(logoContainer.querySelector('.size-12')).not.toBeNull();

    const { container: faviconContainer } = render(
      <BrandAssetField
        tenantId="tenant-1"
        kind="favicon"
        label="Favicon"
        hint="Pre-cropped square, please."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );
    expect(faviconContainer.querySelector('.size-10')).not.toBeNull();
  });

  it('forwards the tenantId and kind to the upload action when a file is selected', async () => {
    uploadBrandAssetActionMock.mockResolvedValue({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/logo-new.png',
    });
    const { container } = render(
      <BrandAssetField
        tenantId="tenant-1"
        kind="logo"
        label="Logo"
        hint="PNG, JPEG, or WebP."
        currentUrl={undefined}
        onChange={vi.fn()}
      />,
    );

    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    await selectFile(container, file);

    await waitFor(() => {
      expect(uploadBrandAssetActionMock).toHaveBeenCalledWith(
        'tenant-1',
        'logo',
        expect.any(FormData),
      );
    });
  });

  it('forwards the tenantId and kind to the clear action when Remove is clicked', async () => {
    clearBrandAssetActionMock.mockResolvedValue({ ok: true });
    const { getByRole } = render(
      <BrandAssetField
        tenantId="tenant-1"
        kind="favicon"
        label="Favicon"
        hint="Pre-cropped square, please."
        currentUrl="https://example.blob.vercel-storage.com/favicon.png"
        onChange={vi.fn()}
      />,
    );

    await userEvent.setup().click(getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(clearBrandAssetActionMock).toHaveBeenCalledWith(
        'tenant-1',
        'favicon',
      );
    });
  });
});
