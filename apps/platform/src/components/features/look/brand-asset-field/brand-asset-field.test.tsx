import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import {
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';

import { BrandAssetField } from './brand-asset-field';

faker.seed(5993);

const MOCK_PNG_FILE_NAME = faker.system.commonFileName('png');

const mockPngFile = () =>
  new File(['bytes'], MOCK_PNG_FILE_NAME, { type: 'image/png' });

const setup = customRender(BrandAssetField, {
  kind: 'logo',
  image: { url: undefined },
  onStage: vi.fn(),
});

describe(`<${BrandAssetField.name}/>`, () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names its upload button after the asset kind', () => {
    setup({ kind: 'favicon' });

    const uploadButton = screen.getByRole('button', {
      name: messages.assetUploadField.favicon.upload,
    });

    expect(uploadButton).toBeVisible();
  });

  it('shows the current image with its replace and remove controls', () => {
    setup({ image: { url: MOCK_LOGO_URL } });

    const thumbnail = screen.getByAltText(
      messages.assetUploadField.logo.currentAlt,
    );
    const replaceButton = screen.getByRole('button', {
      name: messages.assetUploadField.logo.replace,
    });
    const removeButton = screen.getByRole('button', {
      name: messages.assetUploadField.remove,
    });

    expect(thumbnail).toBeVisible();
    expect(replaceButton).toBeVisible();
    expect(removeButton).toBeVisible();
  });

  it('stages a picked file with a local preview URL', async () => {
    const onStage = vi.fn();
    const file = mockPngFile();
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file,
    });
  });

  it('rejects an unsupported type without staging it', async () => {
    const onStage = vi.fn();
    setup({ onStage });

    await selectFile(
      new File(['bytes'], faker.system.commonFileName('gif'), {
        type: 'image/gif',
      }),
    );

    const alert = screen.getByRole('alert');

    expect(onStage).not.toHaveBeenCalled();
    expect(alert).toHaveTextContent(messages.brandAssetField.unsupportedType);
  });

  it('asks for the file to be picked again when a recovered draft lost it', () => {
    setup({ isRepickNeeded: true });

    const pickAgain = screen.getByText(messages.brandAssetField.logo.pickAgain);

    expect(pickAgain).toBeVisible();
  });
});
