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
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import userEvent from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const SAMPLE_TOKENS_TEST_ID = 'look-sample-tokens';
const MOBILE = 'Mobile';
const ARIA_PRESSED = 'aria-pressed';
const PRESSED = 'true';

const renderPreview = (
  values: Partial<TLookFormValues> = {},
  hasReaderAccounts = true,
) => {
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
        hasReaderAccounts={hasReaderAccounts}
      />
    </LookFormProvider>,
  );
};

describe(LookPreview, () => {
  it('renders the tenant name and a real site Button primitive from the preview sample', () => {
    renderPreview();

    const tenantNames = screen.getAllByText(MOCK_TENANT_NAME);
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

    expect(tenantNames.length).toBeGreaterThan(0);
    expect(subscribeButton).toBeVisible();
  });

  it('applies the accent hue as a live CSS custom property on the preview surface', () => {
    renderPreview({ accentHue: 28 });

    const tokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(tokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.51 0.17 28)',
    });
  });

  it('carries the radius scale and density onto the preview surface', () => {
    renderPreview({
      radiusScale: RADIUS_SCALE.XL,
      density: DENSITY.COMPACT,
    });

    const tokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(tokens).toHaveStyle({
      '--radius-md': '12px',
      '--spacing-card-x': '0.75rem',
    });
  });

  it('carries the outlined card style onto the preview surface', () => {
    renderPreview({ cardStyle: CARD_STYLE.OUTLINED });

    const tokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(tokens).toHaveStyle({
      '--item-border-width': '1px',
      '--item-accent-color': 'var(--border)',
    });
  });

  it('switches the preview between desktop and mobile widths', async () => {
    const user = userEvent.setup();
    renderPreview();

    const desktopButton = screen.getByRole('button', { name: 'Desktop' });
    const mobileButton = screen.getByRole('button', { name: MOBILE });

    expect(desktopButton).toHaveAttribute(ARIA_PRESSED, PRESSED);

    await user.click(mobileButton);

    expect(mobileButton).toHaveAttribute(ARIA_PRESSED, PRESSED);
  });

  it('shows the phone header bar in the mobile preview', async () => {
    const user = userEvent.setup();
    renderPreview();

    const mobileButton = screen.getByRole('button', { name: MOBILE });
    await user.click(mobileButton);

    const menuButton = screen.getByRole('button', { name: 'Menu' });
    const postsLink = screen.queryByRole('link', { name: 'Posts' });

    expect(menuButton).toBeVisible();
    expect(postsLink).not.toBeInTheDocument();
  });

  it('re-derives the swatch color when the preview mode toggles to dark, independent of preset', async () => {
    const user = userEvent.setup();
    renderPreview({ accentHue: 28 });

    const darkButton = screen.getByRole('button', { name: 'Dark' });
    await user.click(darkButton);

    const tokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

    expect(tokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });
});
