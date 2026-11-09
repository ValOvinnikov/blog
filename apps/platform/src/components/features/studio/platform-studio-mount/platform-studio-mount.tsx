'use client';

import type { TStudioMountProps } from '@blog/studio';
import { setPersistentCookie } from '@platform/utils/persistent-cookie/persistent-cookie';
import { studioEnteredCookie } from '@platform/utils/studio-entered-cookie/studio-entered-cookie';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { StudioLoading } from './components/studio-loading';
import { type TStudioSchemeProps, useStudioScheme } from './use-studio-scheme';

// Sanity Studio cannot render on the server: its error boundary would fill the server HTML until hydration.
const StudioMount = dynamic(
  () => import('@blog/studio').then(({ StudioMount }) => StudioMount),
  { ssr: false, loading: StudioLoading },
);

export type TPlatformStudioMountProps = Omit<
  TStudioMountProps,
  'onSignedIn' | keyof TStudioSchemeProps
> & {
  firstEntryTenantId?: string;
};

// Always rendered in place of a bare StudioMount, so the refresh after a first entry never remounts the Studio.
export const PlatformStudioMount = ({
  firstEntryTenantId,
  ...studioMountProps
}: TPlatformStudioMountProps) => {
  const router = useRouter();
  const studioScheme = useStudioScheme();

  const recordFirstEntry = (tenantId: string) => () => {
    setPersistentCookie(studioEnteredCookie(tenantId), String(true));
    router.refresh();
  };

  return (
    <StudioMount
      {...studioMountProps}
      {...studioScheme}
      onSignedIn={
        firstEntryTenantId ? recordFirstEntry(firstEntryTenantId) : undefined
      }
    />
  );
};
