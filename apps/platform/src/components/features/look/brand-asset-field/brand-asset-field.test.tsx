import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import {
  BLOB_STAGED_LOGO,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const SAVES_WITH_CHANGES = 'Saves with changes';
const NEW_LOGO_PNG = 'new-logo.png';
const LOGO_PICK_AGAIN =
  "Your recovered draft had a new logo that couldn't be kept — pick it again.";

const setup = customRender(BrandAssetField, {
  kind: 'logo',
  image: { url: undefined },
  onStage: vi.fn(),
});

describe(`<${BrandAssetField.name}/>`, () => {
  const onStage = vi.fn();

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(BLOB_STAGED_LOGO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the field and its upload control after the given kind before any file is chosen', () => {
    setup({ kind: 'favicon' });

    const label = screen.getByText('Favicon');
    const uploadButton = screen.getByRole('button', { name: 'Upload favicon' });

    expect(label).toBeVisible();
    expect(uploadButton).toBeVisible();
  });

  it('names the stored file without marking it as saving with changes', () => {
    setup({ image: { url: `${MOCK_LOGO_URL}?v=2` } });

    const fileName = screen.getByText('brand-logo.png');
    const savesWithChanges = screen.queryByText(SAVES_WITH_CHANGES);

    expect(fileName).toBeVisible();
    expect(savesWithChanges).not.toBeInTheDocument();
  });

  it('names a staged file and marks it as saving with changes', () => {
    const file = new File(['bytes'], NEW_LOGO_PNG, { type: 'image/png' });
    setup({ image: { url: BLOB_STAGED_LOGO, file } });

    const fileName = screen.getByText(NEW_LOGO_PNG);
    const savesWithChanges = screen.getByText(SAVES_WITH_CHANGES);

    expect(fileName).toBeVisible();
    expect(savesWithChanges).toBeVisible();
  });

  it('shows the current alt text and the replace label once a value is set', () => {
    setup({ image: { url: MOCK_LOGO_URL } });

    const currentLogo = screen.getByAltText('Current logo');
    const replaceButton = screen.getByRole('button', { name: 'Replace logo' });

    expect(currentLogo).toBeVisible();
    expect(replaceButton).toBeVisible();
  });

  it('stages a picked file with a local preview URL', async () => {
    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({ url: BLOB_STAGED_LOGO, file });
  });

  it('rejects an unsupported type without staging it', async () => {
    setup({ onStage });

    await selectFile(new File(['x'], 'logo.gif', { type: 'image/gif' }));

    const alert = screen.getByRole('alert');

    expect(onStage).not.toHaveBeenCalled();
    expect(alert).toHaveTextContent('Choose a PNG, JPEG, WebP, or SVG image.');
  });

  it('stages a removal', async () => {
    setup({ image: { url: MOCK_LOGO_URL }, onStage });

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    await userEvent.setup().click(removeButton);

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('asks for the file to be picked again when a recovered draft lost it', () => {
    setup({ isRepickNeeded: true });

    const regions = screen.getAllByRole('status');
    const regionTexts = regions.map((region) => region.textContent);

    expect(regionTexts).toContain(LOGO_PICK_AGAIN);
  });
});
