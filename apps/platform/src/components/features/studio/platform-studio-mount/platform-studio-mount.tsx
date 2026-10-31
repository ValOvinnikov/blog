'use client';

import { StudioMount, type TStudioMountProps } from '@blog/studio';
import { setPersistentCookie } from '@platform/utils/persistent-cookie/persistent-cookie';
import { studioEnteredCookie } from '@platform/utils/studio-entered-cookie/studio-entered-cookie';
import { useRouter } from 'next/navigation';

export type TPlatformStudioMountProps = Omit<
  TStudioMountProps,
  'onSignedIn'
> & {
  firstEntryTenantId?: string;
};

// Always rendered in place of a bare StudioMount, so the refresh after a first entry never remounts the Studio.
export const PlatformStudioMount = ({
  firstEntryTenantId,
  ...studioMountProps
}: TPlatformStudioMountProps) => {
  const router = useRouter();

  const recordFirstEntry = (tenantId: string) => () => {
    setPersistentCookie(studioEnteredCookie(tenantId), String(true));
    router.refresh();
  };

  return (
    <StudioMount
      {...studioMountProps}
      onSignedIn={
        firstEntryTenantId ? recordFirstEntry(firstEntryTenantId) : undefined
      }
    />
  );
};
