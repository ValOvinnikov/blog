import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { SIZE } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

export const UpgradeLinkButton = ({ children }: IWithChildren) => (
  <LinkButton href={adminRoutes.dashboardUpgrade()} size={SIZE.SM}>
    {children}
  </LinkButton>
);
