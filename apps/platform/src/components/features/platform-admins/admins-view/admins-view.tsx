import { AdminInvitesTable } from '@platform/components/features/platform-admins/admins-view/components/admin-invites-table/admin-invites-table';
import { AdminsTable } from '@platform/components/features/platform-admins/admins-view/components/admins-table/admins-table';
import { InviteAdminCard } from '@platform/components/features/platform-admins/admins-view/components/invite-admin-card/invite-admin-card';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TPlatformAdmins } from '@platform/server/platform-admins/load-platform-admins';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const adminsViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
  },
});

export const AdminsView = ({ admins, invites }: TPlatformAdmins) => {
  const t = useTranslations('adminsView');
  const { root } = adminsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <InviteAdminCard />
      <AdminsTable admins={admins} />
      <AdminInvitesTable invites={invites} />
    </div>
  );
};
