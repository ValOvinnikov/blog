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
const MOCK_STORED_LOGO_FILE_NAME = 'brand-logo.png';
const { savesWithChanges: SAVES_WITH_CHANGES } = messages.brandAssetField;

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

  it('names the field and its upload button after the asset kind', () => {
    setup({ kind: 'favicon' });

    const label = screen.getByText(messages.lookForm.faviconFieldLabel);
    const uploadButton = screen.getByRole('button', {
      name: messages.assetUploadField.favicon.upload,
    });

    expect(label).toBeVisible();
    expect(uploadButton).toBeVisible();
  });

  it('names the stored file without marking it as saving with changes', () => {
    setup({ image: { url: `${MOCK_LOGO_URL}?v=2` } });

    const fileName = screen.getByText(MOCK_STORED_LOGO_FILE_NAME);
    const savesWithChanges = screen.queryByText(SAVES_WITH_CHANGES);

    expect(fileName).toBeVisible();
    expect(savesWithChanges).not.toBeInTheDocument();
  });

  it('names a staged file and marks it as saving with changes', () => {
    setup({ image: { url: MOCK_STAGED_LOGO_BLOB_URL, file: mockPngFile() } });

    const fileName = screen.getByText(MOCK_PNG_FILE_NAME);
    const savesWithChanges = screen.getByText(SAVES_WITH_CHANGES);

    expect(fileName).toBeVisible();
    expect(savesWithChanges).toBeVisible();
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
