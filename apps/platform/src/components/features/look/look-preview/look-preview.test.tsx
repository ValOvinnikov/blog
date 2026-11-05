import {
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  RADIUS_SCALE,
} from '@blog/config';
import {
  LookFormProvider,
  type TLookFormContext,
} from '@platform/components/features/look/look-form-provider';
import { DEVICE_FRAME_TEST_ID } from '@platform/constants/device-frame';
import {
  LOOK_FOLLOW_TARGET,
  LOOK_FOLLOW_TEST_ID,
} from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  PREVIEW_DEVICE,
  PREVIEW_FRAME_STATUS_TEST_ID,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { SAMPLE_COOKIE_BUTTON_TEST_ID } from '@platform/constants/sample-footer';
import messages from '@platform/i18n/messages/en.json';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { followLine } from '@platform/testing/look/look-follow';
import { CONSOLE } from '@platform/testing/look/look-form-fixtures';
import { stubLgUpWindow } from '@platform/testing/match-media';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const MOCK_ACCENT_HUE = 28;
const LOOK_PREVIEW = messages.lookPreview;
const LOOK_FOLLOW = messages.lookFollow;
const FOOTER_TARGET: TLookFollowTarget = {
  kind: LOOK_FOLLOW_TARGET.PART,
  row: LOOK_ROW.FOOTER,
};
const STYLE_TARGET: TLookFollowTarget = {
  kind: LOOK_FOLLOW_TARGET.STYLE,
  row: LOOK_ROW.TYPE,
};
const FREE_SAMPLE_NOTE = followLine('freeSample', {
  preset: CONSOLE,
});
const tDevicePreview = makeEnTranslator('devicePreview');
const TABLET = tDevicePreview('deviceTablet');

type TRenderPreviewOptions = {
  values?: Partial<TLookFormValues>;
  previewDevice?: TPreviewDevice;
  hasReaderAccounts?: boolean;
  followTarget?: TLookFollowTarget;
  hasLockedFields?: boolean;
};

const setPreviewDevice = vi.fn();

const renderPreview = ({
  values = {},
  previewDevice = PREVIEW_DEVICE.DESKTOP,
  hasReaderAccounts = true,
  followTarget = { kind: LOOK_FOLLOW_TARGET.IDLE },
  hasLockedFields = false,
}: TRenderPreviewOptions = {}) => {
  const lookForm: TLookFormContext = {
    tenantName: MOCK_TENANT_NAME,
    values: {
      ...defaultLookFormValues(),
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      ...values,
    },
    updateField: vi.fn(),
    isLocked: () => false,
    hasLockedFields,
    hasCardChanges: () => false,
    hasFieldChanged: () => false,
    canResetToPreset: false,
    isAccentHueRejected: false,
    accentHueFieldId: 'accent-hue',
    repickKinds: [],
    brandAssetFieldIds: { logo: 'logo', favicon: 'favicon' },
    brandImageError: undefined,
    changePreset: vi.fn(),
    isPresetValue: () => true,
    resetFieldToPreset: vi.fn(),
    resetToPreset: vi.fn(),
    isSubmenuPreviewOpen: false,
    setIsSubmenuPreviewOpen: vi.fn(),
    previewDevice,
    setPreviewDevice,
  };

  return renderWithIntl(
    <LookFormProvider value={lookForm}>
      <LookPreview
        liveLocales={[LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR]}
        hasReaderAccounts={hasReaderAccounts}
        siteHost={MOCK_TENANT_DOMAIN}
        followTarget={followTarget}
        isShown={true}
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
      tokens: { '--radius-md': '16px', '--spacing-card-x': '0.75rem' },
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
    renderPreview({ values });

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle(tokens);
  });

  it('hands a picked device to the Look form', async () => {
    renderPreview();

    const tabletButton = screen.getByRole('button', { name: TABLET });
    await user.click(tabletButton);

    expect(setPreviewDevice).toHaveBeenCalledWith(PREVIEW_DEVICE.TABLET);
  });

  it('shows the site host in the desktop browser bar', () => {
    renderPreview();

    const browserBar = screen.getByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

    expect(browserBar).toHaveTextContent(MOCK_TENANT_DOMAIN);
  });

  it('offers the reader switch when reader accounts are on', () => {
    renderPreview();

    const readerGroup = screen.getByRole('group', {
      name: LOOK_PREVIEW.readerStateAriaLabel,
    });
    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(readerGroup).toBeVisible();
    expect(statusText).not.toHaveTextContent(LOOK_PREVIEW.readerAccountsOff);
  });

  it('explains the missing reader switch when reader accounts are off', () => {
    renderPreview({ hasReaderAccounts: false });

    const readerGroup = screen.queryByRole('group', {
      name: LOOK_PREVIEW.readerStateAriaLabel,
    });
    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(readerGroup).not.toBeInTheDocument();
    expect(statusText).toHaveTextContent(LOOK_PREVIEW.readerAccountsOff);
  });

  it.each([
    { target: STYLE_TARGET, hasLockedFields: false },
    { target: FOOTER_TARGET, hasLockedFields: true },
  ])(
    'leaves the Free sample note off a $target.row line when locked fields are $hasLockedFields',
    ({ target, hasLockedFields }) => {
      renderPreview({ followTarget: target, hasLockedFields });

      const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

      expect(statusText).not.toHaveTextContent(FREE_SAMPLE_NOTE);
    },
  );

  it('adds the Free sample note after a Style card line on a Free site', () => {
    renderPreview({ followTarget: STYLE_TARGET, hasLockedFields: true });

    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(statusText).toHaveTextContent(
      `${followLine('styleCard', { card: messages.lookForm.typeHeading })} ${FREE_SAMPLE_NOTE}`,
    );
  });

  it('re-derives the accent tokens for the dark preview mode', async () => {
    renderPreview({ values: { accentHue: MOCK_ACCENT_HUE } });

    const darkButton = screen.getByRole('button', { name: 'Dark' });
    await user.click(darkButton);

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });

  it('floats the cookie button over the sample when it is shown', () => {
    renderPreview({
      values: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
    });

    const cookieButton = screen.getByTestId(SAMPLE_COOKIE_BUTTON_TEST_ID);
    const content = screen.getByTestId(DEVICE_FRAME_TEST_ID.CONTENT);

    expect(cookieButton).toBeInTheDocument();
    expect(content).not.toContainElement(cookieButton);
  });

  it('leaves the cookie button out when it is hidden', () => {
    renderPreview({
      values: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.HIDDEN },
    });

    const cookieButton = screen.queryByTestId(SAMPLE_COOKIE_BUTTON_TEST_ID);
    const cookieSettingsLink = screen.getByRole('link', {
      name: LOOK_PREVIEW.footerCookieSettings,
    });

    expect(cookieButton).not.toBeInTheDocument();
    expect(cookieSettingsLink).toBeInTheDocument();
  });

  describe('follow', () => {
    const followButton = () =>
      screen.getByRole('button', { name: LOOK_FOLLOW.followToggle });
    const toolbar = () => screen.getByRole('toolbar');

    it('presses Follow beside the readout, outside the toolbar, on the phone tab', () => {
      renderPreview();

      expect(followButton()).toBePressed();
      expect(toolbar()).not.toContainElement(followButton());
    });

    it('puts Follow inside the toolbar from lg', () => {
      stubLgUpWindow();
      renderPreview();

      const toolbarFollow = within(toolbar()).getByRole('button', {
        name: LOOK_FOLLOW.followToggle,
      });

      expect(toolbarFollow).toBePressed();
    });

    it('outlines the followed part with its name', () => {
      renderPreview({ followTarget: FOOTER_TARGET });

      const outline = screen.getByTestId(LOOK_FOLLOW_TEST_ID.OUTLINE);

      expect(outline).toHaveTextContent(messages.lookForm.footerHeading);
    });

    it('drops the outline and says so once Follow is turned off', async () => {
      renderPreview({ followTarget: FOOTER_TARGET });

      await user.click(followButton());

      const outline = screen.queryByTestId(LOOK_FOLLOW_TEST_ID.OUTLINE);
      const offNote = screen.getByText(LOOK_FOLLOW.off);

      expect(followButton()).not.toBePressed();
      expect(outline).not.toBeInTheDocument();
      expect(offNote).toBeVisible();
    });
  });
});
