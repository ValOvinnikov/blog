import { TextLink } from '@platform/components/shared/text-link';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tv } from '@platform/utils/tv/tv';
import type { TBlockingSuspension } from '@shinefold/db/queries/blocked-signup-identities/list-blocked-identities';
import { useTranslations } from 'next-intl';

const blockSuspensionSourceVariants = tv({
  base: ['text-platform-12-5 text-platform-muted'],
});

export type TBlockSuspensionSourceProps = {
  suspension: TBlockingSuspension;
};

export const BlockSuspensionSource = ({
  suspension,
}: TBlockSuspensionSourceProps) => {
  const t = useTranslations('blockedSignupsTable');
  const { reference, tenantId, tenantName } = suspension;

  return (
    <span className={blockSuspensionSourceVariants()}>
      {t.rich('fromSuspension', {
        reference,
        tenantName,
        tenant: (chunks) => (
          <TextLink href={adminRoutes.tenantOverview(tenantId)}>
            {chunks}
          </TextLink>
        ),
      })}
    </span>
  );
};
