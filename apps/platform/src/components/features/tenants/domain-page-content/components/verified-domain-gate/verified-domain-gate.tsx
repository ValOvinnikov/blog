'use client';

import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { use, type ReactNode } from 'react';

export type TVerifiedDomainGateProps = {
  projectDomain: Promise<TProjectDomain>;
  children: ReactNode;
};

export const VerifiedDomainGate = ({
  projectDomain,
  children,
}: TVerifiedDomainGateProps) => {
  const { status } = use(projectDomain);

  return status === DOMAIN_VERIFICATION_STATUS.VERIFIED ? children : null;
};
