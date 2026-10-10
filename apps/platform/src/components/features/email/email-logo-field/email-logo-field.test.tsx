import { EMAIL_LOGO_KIND } from '@platform/constants/email-logo';
import { customRender, screen } from '@platform/testing/custom-render';
import { selectFile } from '@platform/testing/select-file';
import userEvent from '@testing-library/user-event';

import { EmailLogoField } from './email-logo-field';

const STORED_URL = 'https://example.blob.vercel-storage.com/email-logo.png';

const setup = customRender(EmailLogoField, {
  kind: EMAIL_LOGO_KIND.SENDER,
  label: 'Email logo',
  hint: 'PNG, JPEG, or GIF.',
  logo: { url: undefined },
  onStage: vi.fn(),
});

describe(`<${EmailLogoField.name}/>`, () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the hint and the upload label before any logo is set', () => {
    setup();

    expect(screen.getByText('PNG, JPEG, or GIF.')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Upload email logo' }),
    ).toBeVisible();
  });

  it('shows the current logo and the replace label once a logo is set', () => {
    setup({ logo: { url: STORED_URL } });

    expect(screen.getByAltText('Current email logo')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Replace email logo' }),
    ).toBeVisible();
  });

  it('stages a picked file with a local preview URL', async () => {
    const onStage = vi.fn();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({ url: 'blob:staged-logo', file });
  });

  it('rejects an unsupported type without staging it', async () => {
    const onStage = vi.fn();
    setup({ onStage });

    await selectFile(
      new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' }),
    );

    expect(onStage).not.toHaveBeenCalled();
    expect(screen.getByText(/SVG and WebP are not supported/)).toBeVisible();
  });

  it('stages a removal', async () => {
    const onStage = vi.fn();
    setup({ logo: { url: STORED_URL }, onStage });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Remove' }));

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });
});
