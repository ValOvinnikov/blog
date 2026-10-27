import { faker } from '@faker-js/faker';
import { EMAIL_LOGO_KIND } from '@platform/constants/email-logo';
import en from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { MOCK_EMAIL_LOGO_URL } from '@platform/testing/email/fixtures';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';

import { EmailLogoField } from './email-logo-field';

faker.seed(5993);

const { currentAlt, replace } = en.assetUploadField.SENDER;

const onStage = vi.fn();

const setup = customRenderInSettingsForm(EmailLogoField, {
  kind: EMAIL_LOGO_KIND.SENDER,
  label: faker.lorem.words(2),
  hint: faker.lorem.sentence(),
  logo: { url: undefined },
  onStage,
});

describe(`<${EmailLogoField.name}/>`, () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the current logo and its replace control for the email logo', () => {
    setup({ logo: { url: MOCK_EMAIL_LOGO_URL } });

    const currentLogo = screen.getByAltText(currentAlt);
    const replaceButton = screen.getByRole('button', { name: replace });

    expect(currentLogo).toBeVisible();
    expect(replaceButton).toBeVisible();
  });

  it('stages a picked PNG with a local preview URL', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    setup();

    await selectFile(file);

    expect(onStage).toHaveBeenCalledWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file,
    });
  });

  it('rejects an SVG without staging it', async () => {
    setup();

    await selectFile(
      new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' }),
    );

    const unsupportedError = screen.getByText(
      en.emailLogoField.unsupportedType,
    );

    expect(onStage).not.toHaveBeenCalled();
    expect(unsupportedError).toBeVisible();
  });
});
