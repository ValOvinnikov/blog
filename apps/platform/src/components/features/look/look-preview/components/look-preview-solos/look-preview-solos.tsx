'use client';

import type { Dialog } from '@base-ui/react/dialog';
import { LookFollowToggle } from '@platform/components/features/look/look-preview/components/look-follow-toggle';
import { LookFullscreenButton } from '@platform/components/features/look/look-preview/components/look-fullscreen-button';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import type { Ref } from 'react';

export type TLookPreviewSolosProps = {
  follow: TLookFollow;
  fullscreenHandle: Dialog.Handle<unknown>;
  fullscreenTriggerRef: Ref<HTMLButtonElement>;
};

export const LookPreviewSolos = ({
  follow,
  fullscreenHandle,
  fullscreenTriggerRef,
}: TLookPreviewSolosProps) => (
  <>
    <LookFollowToggle follow={follow} />
    <LookFullscreenButton
      handle={fullscreenHandle}
      triggerRef={fullscreenTriggerRef}
    />
  </>
);
