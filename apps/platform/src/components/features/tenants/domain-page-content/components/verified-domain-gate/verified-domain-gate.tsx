'use client';

import type { IWithChildren } from '@blog/config/react';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/project-domain';
import { use } from 'react';

export type TVerifiedDomainGateProps = IWithChildren & {
  projectDomain: Promise<TProjectDomain>;
};

export const VerifiedDomainGate = ({
  projectDomain,
  children,
}: TVerifiedDomainGateProps) => {
  const { status } = use(projectDomain);

  return status === DOMAIN_VERIFICATION_STATUS.VERIFIED ? children : null;
};
