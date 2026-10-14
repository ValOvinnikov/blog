import { listSessionTenants } from '@platform/server/auth/list-session-tenants';

type TProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: TProps) {
  await listSessionTenants();

  return children;
}
