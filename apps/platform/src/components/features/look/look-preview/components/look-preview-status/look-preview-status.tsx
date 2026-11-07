'use client';

import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookFollowStatus } from '@platform/components/features/look/look-preview/components/look-follow-status';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import { useLookStatusNotes } from '@platform/components/features/look/look-preview/use-look-status-notes';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';

export type TLookPreviewStatusProps = {
  follow: TLookFollow;
  target: TLookFollowTarget;
  hasReaderAccounts: boolean;
};

export const LookPreviewStatus = ({
  follow,
  target,
  hasReaderAccounts,
}: TLookPreviewStatusProps) => {
  const { previewDevice } = useLookForm();
  const isPhoneTab = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const { readerNote, planNote } = useLookStatusNotes(hasReaderAccounts);

  return (
    <LookFollowStatus
      follow={follow}
      target={target}
      device={previewDevice}
      isShortLine={isPhoneTab || !hasReaderAccounts}
      readerNote={readerNote}
      planNote={planNote}
    />
  );
};
