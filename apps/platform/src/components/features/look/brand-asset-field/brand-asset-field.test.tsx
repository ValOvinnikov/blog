import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import { BrandAssetField } from './brand-asset-field';

const STORED_URL = 'https://example.blob.vercel-storage.com/logo.png';

const setup = customRender(BrandAssetField, {
  kind: 'logo',
  label: 'Logo',
  hint: 'PNG, JPEG, or WebP.',
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

  it('shows the hint and the label for the given kind before any file is chosen', () => {
    setup({
      kind: 'favicon',
      label: 'Favicon',
      hint: 'Pre-cropped square, please — non-square uploads are rejected.',
    });

    expect(screen.getByText(/Pre-cropped square, please/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeVisible();
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

    expect(screen.getByRole('status')).toHaveTextContent(
      "Your recovered draft had a new logo that couldn't be kept — pick it again.",
    );
  });
});
