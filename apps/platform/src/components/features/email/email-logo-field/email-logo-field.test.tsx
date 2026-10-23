import { EMAIL_LOGO_KIND } from '@platform/constants/email-logo';
import { screen } from '@platform/testing/custom-render';
import { MOCK_EMAIL_LOGO_URL } from '@platform/testing/email/fixtures';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';
import userEvent from '@testing-library/user-event';

import { EmailLogoField } from './email-logo-field';

const PNG_JPEG_OR_GIF = 'PNG, JPEG, or GIF.';

const setup = customRenderInSettingsForm(EmailLogoField, {
  kind: EMAIL_LOGO_KIND.SENDER,
  label: 'Email logo',
  hint: PNG_JPEG_OR_GIF,
  logo: { url: undefined },
  onStage: vi.fn(),
});

describe(`<${EmailLogoField.name}/>`, () => {
  const onStage = vi.fn();

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the hint and the upload label before any logo is set', () => {
    setup();

    const hint = screen.getByText(PNG_JPEG_OR_GIF);
    const uploadButton = screen.getByRole('button', {
      name: 'Upload email logo',
    });

    expect(hint).toBeVisible();
    expect(uploadButton).toBeVisible();
  });

  it('shows the current logo and the replace label once a logo is set', () => {
    setup({ logo: { url: MOCK_EMAIL_LOGO_URL } });

    const currentLogo = screen.getByAltText('Current email logo');
    const replaceButton = screen.getByRole('button', {
      name: 'Replace email logo',
    });

    expect(currentLogo).toBeVisible();
    expect(replaceButton).toBeVisible();
  });

  it('stages a picked file with a local preview URL', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    setup({ onStage });

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file,
    });
  });

  it('rejects an unsupported type without staging it', async () => {
    setup({ onStage });

    await selectFile(
      new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' }),
    );

    const unsupportedError = screen.getByText(/SVG and WebP are not supported/);

    expect(onStage).not.toHaveBeenCalled();
    expect(unsupportedError).toBeVisible();
  });

  it('stages a removal', async () => {
    setup({ logo: { url: MOCK_EMAIL_LOGO_URL }, onStage });

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    await userEvent.setup().click(removeButton);

    expect(onStage).toHaveBeenCalledWith({ url: undefined });
  });
});
