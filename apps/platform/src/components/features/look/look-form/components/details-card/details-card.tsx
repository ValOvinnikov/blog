import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import {
  toLookGlyphOptions,
  toSkinSwatchOptions,
} from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { BUSY_BUTTON_STYLE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { CookieSettingsButtonField } from './components/cookie-settings-button-field/cookie-settings-button-field';
import { SpinnerStyleField } from './components/spinner-style-field/spinner-style-field';

export type TDetailsCardProps = {
  hasCookieBanner: boolean;
  summary: string;
};

export const DetailsCard = ({
  hasCookieBanner,
  summary,
}: TDetailsCardProps) => {
  const {
    values: { accentHue },
  } = useLookForm();
  const t = useTranslations('lookForm');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.DETAILS],
  );

  const busyOptions = toLookGlyphOptions(
    'busyButtonStyle',
    BUSY_BUTTON_STYLE,
    (style) => t(`busyButtonStyleOptionLabel.${style}`),
  );
  const skinOptions = toSkinSwatchOptions(accentHue, (skin) =>
    t(`skinLabel.${skin}`),
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.DETAILS}
      description={t('detailsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <SpinnerStyleField />
      <LookChoiceField
        field="busyButtonStyle"
        label={t('busyButtonStyleLabel')}
        hint={t('busyButtonStyleDescription')}
        options={busyOptions}
      />
      <LookChoiceField
        field="breadcrumbBackground"
        label={t('breadcrumbBackgroundLabel')}
        hint={t('breadcrumbBackgroundDescription')}
        options={skinOptions}
      />
      <CookieSettingsButtonField hasCookieBanner={hasCookieBanner} />
    </LookCard>
  );
};
