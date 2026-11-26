import { GrantEntitlementControl } from '@platform/components/features/entitlement-grants/grant-entitlement-control';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { TGrantablePresetId } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

export type TPresetGrantControlsProps = {
  target: TGrantTarget;
  presets: readonly TGrantablePresetId[];
  returnFocusId: string;
};

export const PresetGrantControls = ({
  target,
  presets,
  returnFocusId,
}: TPresetGrantControlsProps) => {
  const t = useTranslations('grantEntitlement');
  const tNames = useTranslations('grantItemNames');
  const tPreset = useTranslations('presetPicker');

  return presets.map((preset) => (
    <GrantEntitlementControl
      key={preset}
      target={target}
      item={{ kind: ENTITLEMENT_KIND.PRESET, key: preset }}
      itemLabel={tNames(`preset.${preset}`)}
      triggerLabel={t('presetTrigger', {
        preset: tPreset(PRESET_LABEL_KEY[preset]),
      })}
      returnFocusId={returnFocusId}
    />
  ));
};
