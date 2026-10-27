import {
  CARD_STYLE,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  RADIUS_SCALE,
} from '@blog/config';
import {
  LookFormProvider,
  type TLookFormContext,
} from '@platform/components/features/look/look-form-provider';
import messages from '@platform/i18n/messages/en.json';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const SAMPLE_TOKENS_TEST_ID = 'look-sample-tokens';
const MOCK_ACCENT_HUE = 28;
const ARIA_PRESSED = 'aria-pressed';
const { widthDesktop: DESKTOP, widthMobile: MOBILE } = messages.lookPreview;

const renderPreview = (values: Partial<TLookFormValues> = {}) => {
  const lookForm: TLookFormContext = {
    tenantName: MOCK_TENANT_NAME,
    values: {
      ...defaultLookFormValues(),
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      ...values,
    },
    updateField: vi.fn(),
    hasCardChanges: () => false,
    isDivergedFromPreset: false,
    isAccentHueRejected: false,
    accentHueFieldId: 'accent-hue',
    repickKinds: [],
    brandAssetFieldIds: { logo: 'logo', favicon: 'favicon' },
    brandImageError: undefined,
    changePreset: vi.fn(),
    resetToPreset: vi.fn(),
  };

  return renderWithIntl(
    <LookFormProvider value={lookForm}>
      <LookPreview
        liveLocales={[LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR]}
        hasReaderAccounts={true}
      />
    </LookFormProvider>,
  );
};

describe(`<${LookPreview.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it.each([
    {
      name: 'the accent hue',
      values: { accentHue: MOCK_ACCENT_HUE },
      tokens: { '--brand-primary-solid': 'oklch(0.51 0.17 28)' },
    },
    {
      name: 'the radius scale and density',
      values: { radiusScale: RADIUS_SCALE.XL, density: DENSITY.COMPACT },
      tokens: { '--radius-md': '12px', '--spacing-card-x': '0.75rem' },
    },
    {
      name: 'the outlined card style',
      values: { cardStyle: CARD_STYLE.OUTLINED },
      tokens: {
        '--item-border-width': '1px',
        '--item-accent-color': 'var(--border)',
      },
    },
  ])('carries $name onto the preview surface', ({ values, tokens }) => {
    renderPreview(values);

    const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle(tokens);
  });

  it('switches the preview between desktop and mobile widths', async () => {
    renderPreview();

    const desktopButton = screen.getByRole('button', { name: DESKTOP });
    const mobileButton = screen.getByRole('button', { name: MOBILE });

    expect(desktopButton).toHaveAttribute(ARIA_PRESSED, 'true');

    await user.click(mobileButton);

    expect(mobileButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('shows the phone header bar in the mobile preview', async () => {
    renderPreview();

    const mobileButton = screen.getByRole('button', { name: MOBILE });
    await user.click(mobileButton);

    const menuButton = screen.getByRole('button', {
      name: messages.lookPreview.menuButton,
    });
    const postsLink = screen.queryByRole('link', {
      name: messages.lookPreview.navPosts,
    });

    expect(menuButton).toBeVisible();
    expect(postsLink).not.toBeInTheDocument();
  });

  it('re-derives the accent tokens for the dark preview mode', async () => {
    renderPreview({ accentHue: MOCK_ACCENT_HUE });

    const darkButton = screen.getByRole('button', { name: 'Dark' });
    await user.click(darkButton);

    const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });
});
