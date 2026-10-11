import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import {
  AssetUploadField,
  type TAssetUploadFieldProps,
} from './asset-upload-field';

const baseProps: TAssetUploadFieldProps = {
  label: 'Logo',
  hint: 'PNG, JPEG, or WebP.',
  image: { url: undefined },
  onStage: vi.fn(),
  asset: {
    kind: 'logo',
    size: 'md',
    acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    validateFile: () => undefined,
  },
};

const pngFile = () => new File(['bytes'], 'logo.png', { type: 'image/png' });

const rejectingAsset = {
  ...baseProps.asset,
  validateFile: () => 'Choose a PNG, JPEG, or WebP image.',
};

describe(`<${AssetUploadField.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no thumbnail or Remove control before any value is set', () => {
    renderWithIntl(<AssetUploadField {...baseProps} />);

    expect(screen.queryByAltText('Current logo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument();
  });

  it('shows the thumbnail and a Remove control once a value is set', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: 'https://example.blob.vercel-storage.com/logo.png' }}
      />,
    );

    expect(screen.getByAltText('Current logo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('rejects a file client-side without staging it, showing validateFile’s message', async () => {
    const onStage = vi.fn();
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        asset={rejectingAsset}
        onStage={onStage}
      />,
    );

    await selectFile(pngFile());

    expect(
      await screen.findByText('Choose a PNG, JPEG, or WebP image.'),
    ).toBeVisible();
    expect(onStage).not.toHaveBeenCalled();
  });

  it('stages a chosen file with a local preview URL through onStage', async () => {
    const onStage = vi.fn();
    const file = pngFile();
    renderWithIntl(<AssetUploadField {...baseProps} onStage={onStage} />);

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({ url: 'blob:staged-logo', file });
  });

  it('stages a removal through onStage when Remove is clicked', async () => {
    const onStage = vi.fn();
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: 'https://example.com/logo.png' }}
        onStage={onStage}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('disables the upload and remove controls, and describes them, when isDisabled is true', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: 'https://example.com/logo.png' }}
        isDisabled={true}
        aria-describedby="archived-notice"
      />,
    );

    const uploadButton = screen.getByRole('button', { name: 'Replace logo' });
    expect(uploadButton).toBeDisabled();
    expect(uploadButton).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('archived-notice'),
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('describes the upload and remove controls with the hint', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: 'https://example.com/logo.png' }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Replace logo' }),
    ).toHaveAccessibleDescription('PNG, JPEG, or WebP.');
    expect(
      screen.getByRole('button', { name: 'Remove' }),
    ).toHaveAccessibleDescription('PNG, JPEG, or WebP.');
  });

  it('announces a rejected file and describes the upload control with it', async () => {
    renderWithIntl(<AssetUploadField {...baseProps} asset={rejectingAsset} />);

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
});
