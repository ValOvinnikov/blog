import { Field } from '@base-ui/react/field';
import { GrantEntitlementControl } from '@platform/components/features/entitlement-grants/grant-entitlement-control';
import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { SettingRow } from '@platform/components/shared/setting-row';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Switch } from '@platform/components/shared/switch';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TGrantAccess } from '@platform/utils/grant-target/grant-target';
import { lowestPlanWithCapability } from '@platform/utils/lowest-plan-with-capability/lowest-plan-with-capability';
import type { TCapabilityToggle } from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TCapability } from '@shinefold/config';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { capabilityToggleRowVariants } from './capability-toggle-row-variants';

export type TCapabilityToggleRowProps = {
  toggle: TCapabilityToggle;
  isEntitled: boolean;
  isChecked: boolean;
  isParentOff: boolean;
  constraint?: { requiredReason?: string; error?: string };
  grants: TGrantAccess<TCapability>;
  onCheckedChange: (checked: boolean) => void;
};

export const CapabilityToggleRow = ({
  toggle,
  isEntitled,
  isChecked,
  isParentOff,
  constraint = {},
  grants,
  onCheckedChange,
}: TCapabilityToggleRowProps) => {
  const t = useTranslations('featuresSettings');
  const { isArchived, isPending, archivedDescribedBy } = useSettingsFormState();
  const { grantedStatus } = capabilityToggleRowVariants();
  const { capability, isComingSoon, parentField } = toggle;
  const { requiredReason, error } = constraint;
  const isNested = !isUndefined(parentField);
  const label = t(`toggleLabel.${capability}`);
  const description = t(`toggleDescription.${capability}`);
  const isRequired = !isUndefined(requiredReason);
  const isLocked = !isEntitled || isArchived || isRequired;
  const lockedReason = isEntitled
    ? requiredReason
    : t('planLockedBadge', { plan: lowestPlanWithCapability(capability) });
  const granted = grants.granted[capability];

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
      status={
        granted && !isRequired ? (
          <Field.Description className={grantedStatus()}>
            <GrantedBadge expiresAt={granted.expiresAt} />
          </Field.Description>
        ) : (
          lockedReason && <LockedReason>{lockedReason}</LockedReason>
        )
      }
      error={error}
    >
      {!isEntitled && grants.target && (
        <GrantEntitlementControl
          target={grants.target}
          item={{ kind: ENTITLEMENT_KIND.CAPABILITY, key: capability }}
          itemLabel={label}
        />
      )}
      <Switch
        aria={{ label, describedBy: archivedDescribedBy }}
        isChecked={isChecked}
        onCheckedChange={onCheckedChange}
        isDisabled={!isLocked && (isPending || isParentOff)}
        isLocked={isLocked}
        labels={{ on: t('switchOn'), off: t('switchOff') }}
      />
    </SettingRow>
  );
};
