import { isUndefined } from '@blog/utils/primitives';
import { SettingRow } from '@platform/components/shared/setting-row';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Switch } from '@platform/components/shared/switch';
import { lowestPlanWithCapability } from '@platform/utils/lowest-plan-with-capability/lowest-plan-with-capability';
import type { TCapabilityToggle } from '@platform/utils/settings-features-fields/settings-features-fields';
import { useTranslations } from 'next-intl';

export type TCapabilityToggleRowProps = {
  toggle: TCapabilityToggle;
  isEntitled: boolean;
  isChecked: boolean;
  isParentOff: boolean;
  isFormLocked: boolean;
  describedBy?: string;
  onCheckedChange: (checked: boolean) => void;
};

export const CapabilityToggleRow = ({
  toggle,
  isEntitled,
  isChecked,
  isParentOff,
  isFormLocked,
  describedBy,
  onCheckedChange,
}: TCapabilityToggleRowProps) => {
  const t = useTranslations('featuresSettings');
  const { capability, isComingSoon, parentField } = toggle;
  const isNested = !isUndefined(parentField);
  const label = t(`toggleLabel.${capability}`);
  const description = t(`toggleDescription.${capability}`);

  if (isComingSoon) {
    return (
      <SettingRow label={label} description={description} isNested={isNested}>
        <StatusBadge hasDot={false}>{t('comingSoonBadge')}</StatusBadge>
      </SettingRow>
    );
  }

  return (
    <SettingRow
      label={label}
      description={description}
      isNested={isNested}
      isLocked={!isEntitled}
      lockedReason={
        isEntitled
          ? undefined
          : t('planLockedBadge', { plan: lowestPlanWithCapability(capability) })
      }
    >
      <Switch
        aria={{ label, describedBy }}
        isChecked={isChecked}
        onCheckedChange={onCheckedChange}
        isDisabled={!isEntitled || isParentOff || isFormLocked}
        labels={{ on: t('switchOn'), off: t('switchOff') }}
      />
    </SettingRow>
  );
};
