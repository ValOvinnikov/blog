import { render, screen, waitFor } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import {
  AssetUploadField,
  type TAssetUploadFieldProps,
} from './asset-upload-field';

const baseProps: TAssetUploadFieldProps = {
  label: 'Logo',
  hint: 'PNG, JPEG, or WebP.',
  currentUrl: undefined,
  currentAlt: 'Current logo',
  acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  uploadLabel: 'Upload logo',
  uploadingLabel: 'Uploading…',
  removeLabel: 'Remove',
  unexpectedErrorLabel: 'Something went wrong — try again.',
  onValidateFile: () => undefined,
  onUpload: vi.fn(),
  onClear: vi.fn(),
  onChange: vi.fn(),
};

const pngFile = () => new File(['bytes'], 'logo.png', { type: 'image/png' });

describe(`<${AssetUploadField.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows no thumbnail or Remove control before any value is set', () => {
    render(<AssetUploadField {...baseProps} />);

    expect(screen.queryByAltText('Current logo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument();
  });

  it('shows the thumbnail and a Remove control once a value is set', () => {
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.blob.vercel-storage.com/logo.png"
      />,
    );

    expect(screen.getByAltText('Current logo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('rejects a file client-side without calling onUpload, showing onValidateFile’s message', async () => {
    const onUpload = vi.fn();
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        onValidateFile={() => 'Choose a PNG, JPEG, or WebP image.'}
        onUpload={onUpload}
        onChange={onChange}
      />,
    );

    await selectFile(pngFile());

    expect(
      await screen.findByText('Choose a PNG, JPEG, or WebP image.'),
    ).toBeVisible();
    expect(onUpload).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uploads a chosen file and reports the saved URL back through onChange', async () => {
    const onUpload = vi
      .fn()
      .mockResolvedValue({ ok: true, url: 'https://example.com/logo-new.png' });
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        onUpload={onUpload}
        onChange={onChange}
      />,
    );

    await selectFile(pngFile());

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('https://example.com/logo-new.png');
    });
    expect(onUpload).toHaveBeenCalledWith(expect.any(FormData));
  });

  it('shows the server error and keeps the previous value when the upload fails', async () => {
    const onUpload = vi
      .fn()
      .mockResolvedValue({ ok: false, error: 'That file is too large.' });
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.com/logo.png"
        onUpload={onUpload}
        onChange={onChange}
      />,
    );

    await selectFile(pngFile());

    expect(await screen.findByText('That file is too large.')).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByAltText('Current logo')).toBeVisible();
  });

  it('shows the unexpectedErrorLabel fallback, without crashing, when onUpload itself throws', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('network error'));
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        onUpload={onUpload}
        onChange={onChange}
      />,
    );

    await selectFile(pngFile());

    expect(
      await screen.findByText('Something went wrong — try again.'),
    ).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the saved value through onClear when Remove is clicked', async () => {
    const onClear = vi.fn().mockResolvedValue({ ok: true });
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.com/logo.png"
        onClear={onClear}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('shows the server error and keeps the value when onClear fails', async () => {
    const onClear = vi
      .fn()
      .mockResolvedValue({ ok: false, error: 'Could not remove the logo.' });
    const onChange = vi.fn();
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.com/logo.png"
        onClear={onClear}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Could not remove the logo.')).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables the upload and remove controls, and describes them, when isDisabled is true', () => {
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.com/logo.png"
        isDisabled={true}
        aria-describedby="archived-notice"
      />,
    );

    const uploadButton = screen.getByRole('button', { name: 'Upload logo' });
    expect(uploadButton).toBeDisabled();
    expect(uploadButton).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('archived-notice'),
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('describes the upload and remove controls with the hint', () => {
    render(
      <AssetUploadField
        {...baseProps}
        currentUrl="https://example.com/logo.png"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Upload logo' }),
    ).toHaveAccessibleDescription('PNG, JPEG, or WebP.');
    expect(
      screen.getByRole('button', { name: 'Remove' }),
    ).toHaveAccessibleDescription('PNG, JPEG, or WebP.');
  });

  it('announces a rejected file and describes the upload control with it', async () => {
    render(
      <AssetUploadField
        {...baseProps}
        onValidateFile={() => 'Choose a PNG, JPEG, or WebP image.'}
      />,
    );

    await selectFile(pngFile());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a PNG, JPEG, or WebP image.',
    );
    expect(
      screen.getByRole('button', { name: 'Upload logo' }),
    ).toHaveAccessibleDescription(
      'PNG, JPEG, or WebP. Choose a PNG, JPEG, or WebP image.',
    );
  });

  it('announces the uploading label while the file is being processed', async () => {
    render(
      <AssetUploadField
        {...baseProps}
        onUpload={() => new Promise(() => undefined)}
      />,
    );

    await selectFile(pngFile());

    expect(await screen.findByRole('status')).toHaveTextContent('Uploading…');
    expect(screen.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
  });
});
