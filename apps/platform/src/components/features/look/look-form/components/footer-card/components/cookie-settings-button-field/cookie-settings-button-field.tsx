import {
  COOKIE_SETTINGS_BUTTON,
  type TCookieSettingsButton,
} from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

const COOKIE_SETTINGS_BUTTON_ORDER = [
  COOKIE_SETTINGS_BUTTON.HIDDEN,
  COOKIE_SETTINGS_BUTTON.ONLY,
  COOKIE_SETTINGS_BUTTON.SHOWN,
];

export type TCookieSettingsButtonFieldProps = {
  hasCookieBanner: boolean;
};

export const CookieSettingsButtonField = ({
  hasCookieBanner,
}: TCookieSettingsButtonFieldProps) => {
  const {
    values: { cookieSettingsButton },
    updateField,
  } = useLookForm();
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const t = useTranslations('lookForm');
  const bannerOffNoteId = useId();

  const options = toLookGlyphOptions(
    'cookieSettingsButton',
    COOKIE_SETTINGS_BUTTON_ORDER,
    (reach) => t(`cookieSettingsButtonOptionLabel.${reach}`),
  );
  const describedBy = joinIds(
    archivedDescribedBy,
    hasCookieBanner ? undefined : bannerOffNoteId,
  );

  return (
    <LookField
      field="cookieSettingsButton"
      label={t('cookieSettingsButtonLabel')}
      hint={t('cookieSettingsButtonDescription')}
      isGroup={true}
    >
      <SegmentedControl<TCookieSettingsButton>
        aria={{ describedBy }}
        options={options}
        value={cookieSettingsButton}
        onChange={(reach) => updateField('cookieSettingsButton', reach)}
        lock={{ isDisabled: isArchived || !hasCookieBanner }}
      />
      {!hasCookieBanner && (
        <p id={bannerOffNoteId} className={textVariants({ variant: 'hint' })}>
          {t('cookieSettingsButtonBannerOff')}
        </p>
      )}
    </LookField>
  );
};
