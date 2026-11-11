import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import {
  LookFormProvider,
  type TLookFormContext,
} from '@platform/components/features/look/look-form-provider';
import { LookPreview } from '@platform/components/features/look/look-preview/look-preview';
import { LOOK_FOLLOW_TARGET } from '@platform/constants/look-follow';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { renderWithIntl } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';

export type TRenderPreviewOptions = {
  values?: Partial<TLookFormValues>;
  previewDevice?: TPreviewDevice;
  hasReaderAccounts?: boolean;
  hasCookieBanner?: boolean;
  followTarget?: TLookFollowTarget;
  hasLockedFields?: boolean;
};

export const setPreviewDevice = vi.fn();

export const lookPreview = ({
  values = {},
  previewDevice = PREVIEW_DEVICE.DESKTOP,
  hasReaderAccounts = true,
  hasCookieBanner = true,
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
    isBrandNameTooLong: false,
    brandNameFieldId: 'brand-name',
    shownBrandName: MOCK_TENANT_NAME,
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

  return (
    <LookFormProvider value={lookForm}>
      <LookPreview
        liveLocales={[LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR]}
        hasReaderAccounts={hasReaderAccounts}
        hasCookieBanner={hasCookieBanner}
        siteHost={MOCK_TENANT_DOMAIN}
        followTarget={followTarget}
        isShown={true}
        isScrollingWithPage={false}
      />
    </LookFormProvider>
  );
};

export const renderPreview = (options: TRenderPreviewOptions = {}) =>
  renderWithIntl(lookPreview(options));
