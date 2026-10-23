import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const BLOB_STAGED_LOGO = 'blob:staged-logo';
const SAVES_WITH_CHANGES = 'Saves with changes';
const NEW_LOGO_PNG = 'new-logo.png';

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

    expect(screen.getByText('Favicon')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeVisible();
  });

  it('names the stored file without marking it as saving with changes', () => {
    setup({ image: { url: `${MOCK_LOGO_URL}?v=2` } });

    expect(screen.getByText('brand-logo.png')).toBeVisible();
    expect(screen.queryByText(SAVES_WITH_CHANGES)).not.toBeInTheDocument();
  });

  it('names a staged file and marks it as saving with changes', () => {
    const file = new File(['bytes'], NEW_LOGO_PNG, { type: 'image/png' });
    setup({ image: { url: BLOB_STAGED_LOGO, file } });

    expect(screen.getByText(NEW_LOGO_PNG)).toBeVisible();
    expect(screen.getByText(SAVES_WITH_CHANGES)).toBeVisible();
  });

  it('shows the current alt text and the replace label once a value is set', () => {
    setup({ image: { url: MOCK_LOGO_URL } });

    expect(screen.getByAltText('Current logo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Replace logo' })).toBeVisible();
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

    expect(onStage).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a PNG, JPEG, WebP, or SVG image.',
    );
  });

  it('stages a removal', async () => {
    setup({ image: { url: MOCK_LOGO_URL }, onStage });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Remove' }));

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });

  it('asks for the file to be picked again when a recovered draft lost it', () => {
    setup({ isRepickNeeded: true });

    expect(
      screen.getAllByRole('status').map((region) => region.textContent),
    ).toContainEqual(
      expect.stringContaining(
        "Your recovered draft had a new logo that couldn't be kept — pick it again.",
      ),
    );
  });
});
