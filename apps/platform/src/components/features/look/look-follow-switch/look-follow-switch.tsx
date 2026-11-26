'use client';

import { Switch } from '@platform/components/shared/switch';
import { useId } from 'react';

import { lookFollowSwitchVariants } from './look-follow-switch-variants';

type TLookFollowLock = {
  isDisabled: boolean;
  isLocked: boolean;
  growthBadgeId?: string;
  describedBy?: string;
};

export type TLookFollowSwitchProps = {
  label: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  lock: TLookFollowLock;
  lockedReadout?: string;
};

/** Following is the field's own state, so a value picked to match what it follows still reads as picked. */
export const LookFollowSwitch = ({
  label,
  isFollowing,
  onFollowChange,
  lock: { isDisabled, isLocked, growthBadgeId, describedBy },
  lockedReadout,
}: TLookFollowSwitchProps) => {
  const captionId = useId();
  const { root, readout } = lookFollowSwitchVariants();

  return (
    <div className={root()}>
      <Switch
        aria={
          growthBadgeId
            ? { labelledBy: `${captionId} ${growthBadgeId}`, describedBy }
            : { label, describedBy }
        }
        isChecked={isFollowing}
        onCheckedChange={onFollowChange}
        labels={{ caption: label, captionId }}
        isDisabled={isDisabled}
        isLocked={isLocked}
      />
      {lockedReadout && isLocked && isFollowing && (
        <span className={readout()}>{lockedReadout}</span>
      )}
    </div>
  );
};
