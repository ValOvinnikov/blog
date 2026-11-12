'use client';

import { useTenantOverviewFocus } from '@platform/components/features/tenants/tenant-overview-focus-provider';
import {
  TenantPageHeader,
  type TTenantPageHeaderProps,
} from '@platform/components/features/tenants/tenant-page-header';

export type TTenantOverviewHeaderProps = Pick<TTenantPageHeaderProps, 'tenant'>;

export const TenantOverviewHeader = ({
  tenant,
}: TTenantOverviewHeaderProps) => {
  const { registerHeading } = useTenantOverviewFocus();

  return <TenantPageHeader tenant={tenant} titleRef={registerHeading} />;
};
