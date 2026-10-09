import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const STORED_URL = 'https://example.blob.vercel-storage.com/logo.png';

const setup = customRender(BrandAssetField, {
  kind: 'logo',
  label: 'Logo',
  image: { url: undefined },
  onStage: vi.fn(),
});

describe(`<${BrandAssetField.name}/>`, () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the upload label for the given kind before any file is chosen', () => {
    setup({ kind: 'favicon', label: 'Favicon' });

    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeVisible();
  });

  it('names the stored file without marking it as saving with changes', () => {
    setup({ image: { url: `${STORED_URL}?v=2` } });

    expect(screen.getByText('logo.png')).toBeVisible();
    expect(screen.queryByText('Saves with changes')).not.toBeInTheDocument();
  });

  it('names a staged file and marks it as saving with changes', () => {
    const file = new File(['bytes'], 'new-logo.png', { type: 'image/png' });
    setup({ image: { url: 'blob:staged-logo', file } });

    expect(screen.getByText('new-logo.png')).toBeVisible();
    expect(screen.getByText('Saves with changes')).toBeVisible();
  });

  it('shows the current alt text and the replace label once a value is set', () => {
    setup({ image: { url: STORED_URL } });

    expect(screen.getByAltText('Current logo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Replace logo' })).toBeVisible();
  });

  it('stages a picked file with a local preview URL', async () => {
    const onStage = vi.fn();
    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({ url: 'blob:staged-logo', file });
  });

  it('rejects an unsupported type without staging it', async () => {
    const onStage = vi.fn();
    setup({ onStage });

    await selectFile(new File(['x'], 'logo.gif', { type: 'image/gif' }));

    expect(onStage).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a PNG, JPEG, WebP, or SVG image.',
    );
  });

  it('stages a removal', async () => {
    const onStage = vi.fn();
    setup({ image: { url: STORED_URL }, onStage });

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
