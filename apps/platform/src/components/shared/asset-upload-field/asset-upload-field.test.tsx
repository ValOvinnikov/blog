import { SIZE } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  REPLACE_LOGO,
  UPLOAD_LOGO,
} from '@platform/testing/site-config/fixtures';
import userEvent from '@testing-library/user-event';

import {
  AssetUploadField,
  type TAssetUploadFieldProps,
} from './asset-upload-field';

const PNG_JPEG_OR_WEBP = 'PNG, JPEG, or WebP.';
const CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE = 'Choose a PNG, JPEG, or WebP image.';
const STORED_LOGO_URL = 'https://example.com/logo.png';
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
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no thumbnail or Remove control before any value is set', () => {
    renderWithIntl(<AssetUploadField {...baseProps} />);

    const thumbnail = screen.queryByAltText(CURRENT_LOGO);
    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });
    const removeButton = screen.queryByRole('button', { name: 'Remove' });

    expect(thumbnail).not.toBeInTheDocument();
    expect(uploadButton).toBeVisible();
    expect(removeButton).not.toBeInTheDocument();
  });

  it('shows the thumbnail and a Remove control once a value is set', () => {
    renderWithIntl(
      <AssetUploadField {...baseProps} image={{ url: MOCK_LOGO_URL }} />,
    );

    const thumbnail = screen.getByAltText(CURRENT_LOGO);
    const removeButton = screen.getByRole('button', { name: 'Remove' });

    expect(thumbnail).toBeVisible();
    expect(removeButton).toBeVisible();
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

    const rejection = await screen.findByText(CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE);

    expect(rejection).toBeVisible();
    expect(onStage).not.toHaveBeenCalled();
  });

  it('stages a chosen file with a local preview URL through onStage', async () => {
    const file = pngFile();
    renderWithIntl(<AssetUploadField {...baseProps} onStage={onStage} />);

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file,
    });
  });

  it('stages a removal through onStage when Remove is clicked', async () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: STORED_LOGO_URL }}
        onStage={onStage}
      />,
    );

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    await user.click(removeButton);

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('disables the upload and remove controls, and describes them, when the control is disabled', () => {
    renderWithIntl(
      <AssetUploadField
        {...baseProps}
        image={{ url: STORED_LOGO_URL }}
        control={{ isDisabled: true, describedBy: ARCHIVED_NOTICE_ID }}
      />,
    );

    const uploadButton = screen.getByRole('button', { name: REPLACE_LOGO });
    const removeButton = screen.getByRole('button', { name: 'Remove' });
    const hint = screen.getByText(PNG_JPEG_OR_WEBP);

    expect(uploadButton).toBeDisabled();
    expect(uploadButton).toHaveAttribute(
      'aria-describedby',
      `${hint.id} ${ARCHIVED_NOTICE_ID}`,
    );
    expect(removeButton).toBeDisabled();
  });

  it('describes the upload and remove controls with the hint', () => {
    renderWithIntl(
      <AssetUploadField {...baseProps} image={{ url: STORED_LOGO_URL }} />,
    );

    const uploadButton = screen.getByRole('button', { name: REPLACE_LOGO });
    const removeButton = screen.getByRole('button', { name: 'Remove' });

    expect(uploadButton).toHaveAccessibleDescription(PNG_JPEG_OR_WEBP);
    expect(removeButton).toHaveAccessibleDescription(PNG_JPEG_OR_WEBP);
  });

  it('announces a rejected file and describes the upload control with it', async () => {
    renderWithIntl(<AssetUploadField {...baseProps} asset={rejectingAsset} />);

    await selectFile(pngFile());

    const alert = await screen.findByRole('alert');
    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });

    expect(alert).toHaveTextContent(CHOOSE_A_PNG_JPEG_OR_WEBP_IMAGE);
    expect(uploadButton).toHaveAccessibleDescription(
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
    const alert = screen.queryByRole('alert');

    expect(error).toBeVisible();
    expect(uploadButton).toHaveAttribute('id', LOGO_CONTROL);
    expect(uploadButton).toHaveAccessibleDescription(
      "PNG, JPEG, or WebP. Couldn't upload the logo — try again.",
    );
    expect(alert).not.toBeInTheDocument();
  });
});
