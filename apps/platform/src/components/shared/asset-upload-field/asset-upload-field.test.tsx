import { SIZE } from '@blog/config';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import {
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
  UPLOAD_LOGO,
} from '@platform/testing/site-config/fixtures';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  brandAssetKindSchema,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AssetUploadField, type TAssetUploadSpec } from './asset-upload-field';

faker.seed(5995);

const REMOVE = messages.assetUploadField.remove;

const MOCK_LABEL = faker.lorem.word();
const MOCK_HINT = faker.lorem.sentence();
const MOCK_REJECTION = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_CONTROL_ID = faker.string.alpha(8);

const MOCK_ASSET: TAssetUploadSpec = {
  kind: brandAssetKindSchema.enum.logo,
  size: SIZE.MD,
  acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
  validateFile: () => undefined,
};

const MOCK_REJECTING_ASSET: TAssetUploadSpec = {
  ...MOCK_ASSET,
  validateFile: () => MOCK_REJECTION,
};

const mockPngFile = () =>
  new File(['bytes'], faker.system.fileName(), { type: 'image/png' });

const setup = customRender(AssetUploadField, {
  label: MOCK_LABEL,
  hint: MOCK_HINT,
  image: { url: undefined },
  onStage: vi.fn(),
  asset: MOCK_ASSET,
});

describe(`<${AssetUploadField.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no thumbnail or remove control before any value is set', () => {
    setup();

    const thumbnail = screen.queryByAltText(CURRENT_LOGO);
    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });
    const removeButton = screen.queryByRole('button', { name: REMOVE });

    expect(thumbnail).not.toBeInTheDocument();
    expect(uploadButton).toBeVisible();
    expect(removeButton).not.toBeInTheDocument();
  });

  it('shows the thumbnail and a remove control once a value is set', () => {
    setup({ image: { url: MOCK_LOGO_URL } });

    const thumbnail = screen.getByAltText(CURRENT_LOGO);
    const removeButton = screen.getByRole('button', { name: REMOVE });

    expect(thumbnail).toBeVisible();
    expect(removeButton).toBeVisible();
  });

  it('shows a rejected file’s message without staging it', async () => {
    const onStage = vi.fn();
    setup({ asset: MOCK_REJECTING_ASSET, onStage });

    await selectFile(mockPngFile());

    const rejection = await screen.findByText(MOCK_REJECTION);

    expect(rejection).toBeVisible();
    expect(onStage).not.toHaveBeenCalled();
  });

  it('stages a chosen file with a local preview URL', async () => {
    const onStage = vi.fn();
    const file = mockPngFile();
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file,
    });
  });

  it('stages a removal when remove is clicked', async () => {
    const onStage = vi.fn();
    setup({ image: { url: MOCK_LOGO_URL }, onStage });

    const removeButton = screen.getByRole('button', { name: REMOVE });
    await user.click(removeButton);

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('disables and describes both controls when the control is disabled', () => {
    setup({
      image: { url: MOCK_LOGO_URL },
      control: { isDisabled: true, describedBy: ARCHIVED_NOTICE_ID },
    });

    const uploadButton = screen.getByRole('button', { name: REPLACE_LOGO });
    const removeButton = screen.getByRole('button', { name: REMOVE });
    const hint = screen.getByText(MOCK_HINT);

    expect(uploadButton).toBeDisabled();
    expect(uploadButton).toHaveAttribute(
      'aria-describedby',
      `${hint.id} ${ARCHIVED_NOTICE_ID}`,
    );
    expect(removeButton).toBeDisabled();
  });

  it('describes the upload and remove controls with the hint', () => {
    setup({ image: { url: MOCK_LOGO_URL } });

    const uploadButton = screen.getByRole('button', { name: REPLACE_LOGO });
    const removeButton = screen.getByRole('button', { name: REMOVE });

    expect(uploadButton).toHaveAccessibleDescription(MOCK_HINT);
    expect(removeButton).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('announces a rejected file and describes the upload control with it', async () => {
    setup({ asset: MOCK_REJECTING_ASSET });

    await selectFile(mockPngFile());

    const alert = await screen.findByRole('alert');
    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });

    expect(alert).toHaveTextContent(MOCK_REJECTION);
    expect(uploadButton).toHaveAccessibleDescription(
      `${MOCK_HINT} ${MOCK_REJECTION}`,
    );
  });

  it('shows a given error and describes the upload control without announcing it', () => {
    setup({ control: { id: MOCK_CONTROL_ID }, error: MOCK_ERROR });

    const uploadButton = screen.getByRole('button', { name: UPLOAD_LOGO });
    const error = screen.getByText(MOCK_ERROR);
    const alert = screen.queryByRole('alert');

    expect(error).toBeVisible();
    expect(uploadButton).toHaveAttribute('id', MOCK_CONTROL_ID);
    expect(uploadButton).toHaveAccessibleDescription(
      `${MOCK_HINT} ${MOCK_ERROR}`,
    );
    expect(alert).not.toBeInTheDocument();
  });
});
