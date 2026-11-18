import { GrantEntitlementControl } from '@platform/components/features/entitlement-grants/grant-entitlement-control';
import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { GrowthBadge } from '@platform/components/shared/growth-badge';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TMaybeUndefined } from '@shinefold/config';
import { ENTITLEMENT_KIND, LOOK_FIELDS } from '@shinefold/db/constants';
import { isOneOf } from '@shinefold/utils/primitives';

export type TLookFieldBadgeProps = {
  field: keyof TLookFormValues;
  label: string;
  growthBadgeId: TMaybeUndefined<string>;
};

export const LookFieldBadge = ({
  field,
  label,
  growthBadgeId,
}: TLookFieldBadgeProps) => {
  const { grants } = useLookForm();

  if (!isOneOf(LOOK_FIELDS, field)) return null;

  if (growthBadgeId) {
    return (
      <>
        <GrowthBadge id={growthBadgeId} />
        {grants.target && (
          <GrantEntitlementControl
            target={grants.target}
            item={{ kind: ENTITLEMENT_KIND.LOOK_FIELD, key: field }}
            itemLabel={label}
          />
        )}
      </>
    );
  }

  const granted = grants.granted[field];

  return granted && <GrantedBadge expiresAt={granted.expiresAt} />;
};
