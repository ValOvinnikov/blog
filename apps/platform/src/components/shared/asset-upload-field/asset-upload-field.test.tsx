import { SIZE } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import userEvent from '@testing-library/user-event';

import {
  AssetUploadField,
  type TAssetUploadFieldProps,
} from './asset-upload-field';

const PNG_JPEG_OR_WEBP = 'PNG, JPEG, or WebP.';
const CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE = 'Choose a PNG, JPEG, or WebP image.';
const BLOB_STAGED_LOGO = 'blob:staged-logo';
const CURRENT_LOGO = 'Current logo';
const UPLOAD_LOGO = 'Upload logo';
const STORED_LOGO_URL = 'https://example.com/logo.png';
const ARCHIVED_NOTICE = 'archived-notice';
const REPLACE_LOGO = 'Replace logo';
const LOGO_CONTROL = 'logo-control';

const baseProps: TAssetUploadFieldProps = {
  label: 'Logo',
  hint: PNG_JPEG_OR_WEBP,
  image: { url: undefined },
  onStage: vi.fn(),
  asset: {
    kind: 'logo',
    size: SIZE.MD,
    acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    validateFile: () => undefined,
  },
};

const pngFile = () => new File(['bytes'], 'logo.png', { type: 'image/png' });

const rejectingAsset = {
  ...baseProps.asset,
  validateFile: () => CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE,
};

describe(`<${AssetUploadField.name}/>`, () => {
  const onStage = vi.fn();

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(BLOB_STAGED_LOGO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no thumbnail or Remove control before any value is set', () => {
    renderWithIntl(<AssetUploadField {...baseProps} />);

    expect(screen.queryByAltText(CURRENT_LOGO)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: UPLOAD_LOGO })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument();
  });

  it('shows the thumbnail and a Remove control once a value is set', () => {
    renderWithIntl(
      <AssetUploadField {...baseProps} image={{ url: MOCK_LOGO_URL }} />,
    );

    expect(screen.getByAltText(CURRENT_LOGO)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('rejects a file client-side without staging it, showing validateFile’s message', async () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        asset={rejectingAsset}
        onStage={onStage}
      />,
    );

    await selectFile(pngFile());

    expect(
      await screen.findByText(CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE),
    ).toBeVisible();
    expect(onStage).not.toHaveBeenCalled();
  });

  it('stages a chosen file with a local preview URL through onStage', async () => {
    const file = pngFile();
    renderWithIntl(<AssetUploadField {...baseProps} onStage={onStage} />);

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({ url: BLOB_STAGED_LOGO, file });
  });

  it('stages a removal through onStage when Remove is clicked', async () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: STORED_LOGO_URL }}
        onStage={onStage}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('disables the upload and remove controls, and describes them, when the control is disabled', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: STORED_LOGO_URL }}
        control={{ isDisabled: true, describedBy: ARCHIVED_NOTICE }}
      />,
    );

    const uploadButton = screen.getByRole('button', { name: REPLACE_LOGO });
    expect(uploadButton).toBeDisabled();
    expect(uploadButton).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(ARCHIVED_NOTICE),
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('describes the upload and remove controls with the hint', () => {
    renderWithIntl(
      <AssetUploadField {...baseProps} image={{ url: STORED_LOGO_URL }} />,
    );

    expect(
      screen.getByRole('button', { name: REPLACE_LOGO }),
    ).toHaveAccessibleDescription(PNG_JPEG_OR_WEBP);
    expect(
      screen.getByRole('button', { name: 'Remove' }),
    ).toHaveAccessibleDescription(PNG_JPEG_OR_WEBP);
  });

  it('announces a rejected file and describes the upload control with it', async () => {
    renderWithIntl(<AssetUploadField {...baseProps} asset={rejectingAsset} />);

    await selectFile(pngFile());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE,
    );
    expect(
      screen.getByRole('button', { name: UPLOAD_LOGO }),
    ).toHaveAccessibleDescription(
      'PNG, JPEG, or WebP. Choose a PNG, JPEG, or WebP image.',
    );
  });

  it('shows a given error under the field and describes the upload control with it, without announcing it', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        control={{ id: LOGO_CONTROL }}
        error="Couldn't upload the logo — try again."
      />,
    );

    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });
    const error = screen.getByText("Couldn't upload the logo — try again.");
    expect(error).toBeVisible();
    expect(uploadButton).toHaveAttribute('id', LOGO_CONTROL);
    expect(uploadButton).toHaveAccessibleDescription(
      "PNG, JPEG, or WebP. Couldn't upload the logo — try again.",
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
