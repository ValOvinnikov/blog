import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import {
  buttonColorFollowKey,
  isButtonColorInvalid,
  toButtonColors,
  toPresetButtonColor,
} from '@platform/utils/button-colors/button-colors';
import {
  ACCENT_RAMP_LIGHT,
  COLOR_SCHEME,
  findFaintButtonGrounds,
  ICONS,
  oklchStopToHex,
} from '@shinefold/config';
import { hasArrayGotItems, isUndefined } from '@shinefold/utils/primitives';
import { useFormatter, useTranslations } from 'next-intl';

import { ButtonColorField } from './components/button-color-field/button-color-field';

export const ButtonColorFields = () => {
  const {
    values: { preset, accentHue, buttonColor, buttonColorDark },
    updateField,
    buttonColorFieldIds,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const format = useFormatter();
  const colorLock = useLookFieldLock('buttonColor');
  const darkLock = useLookFieldLock('buttonColorDark');
  const colors = toButtonColors({ buttonColor, buttonColorDark });
  const faintGrounds = colors ? findFaintButtonGrounds(colors, accentHue) : [];
  const isColorInvalid = isButtonColorInvalid(buttonColor);
  const isDarkInvalid = isButtonColorInvalid(buttonColorDark);
  const accentFill = oklchStopToHex(
    ACCENT_RAMP_LIGHT['--brand-primary-solid'],
    accentHue,
  );
  const followedFill = toPresetButtonColor(preset) ?? accentFill;

  return (
    <>
      <LookField
        field="buttonColor"
        label={t('buttonColorLabel')}
        hint={t('buttonColorDescription')}
        error={isColorInvalid ? t('buttonColorInvalid') : undefined}
        isGroup={true}
        lock={colorLock}
      >
        <ButtonColorField
          color={buttonColor}
          seedColor={followedFill}
          onChange={(color) => {
            updateField('buttonColor', color);
            if (isUndefined(color)) updateField('buttonColorDark', undefined);
          }}
          followLabel={t(buttonColorFollowKey(preset))}
          inputId={buttonColorFieldIds.buttonColor}
          isInvalid={isColorInvalid}
          lock={colorLock}
        />
        {hasArrayGotItems(faintGrounds) && (
          <LockedReason icon={ICONS.WARNING}>
            {t('buttonColorFaint', {
              grounds: format.list(
                faintGrounds.map(({ variant, scheme }) =>
                  t('buttonColorFaintGround', {
                    skin: t(`skinLabel.${variant}`),
                    scheme,
                  }),
                ),
              ),
            })}
          </LockedReason>
        )}
      </LookField>

      <LookField
        field="buttonColorDark"
        label={t('buttonColorDarkLabel')}
        hint={t('buttonColorDarkDescription')}
        error={isDarkInvalid ? t('buttonColorInvalid') : undefined}
        isGroup={true}
        lock={darkLock}
      >
        <ButtonColorField
          color={buttonColorDark}
          seedColor={colors?.[COLOR_SCHEME.DARK].fill ?? followedFill}
          onChange={(color) => updateField('buttonColorDark', color)}
          followLabel={t('buttonColorDarkFollow')}
          inputId={buttonColorFieldIds.buttonColorDark}
          isInvalid={isDarkInvalid}
          lock={{
            ...darkLock,
            isDisabled: isUndefined(buttonColor),
          }}
        />
      </LookField>
    </>
  );
};
