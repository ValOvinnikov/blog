import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';

type TProps = {
  children: React.ReactNode;
};

export default async function DataRequestsLayout({ children }: TProps) {
  await requireSuperAdmin();

  return children;
}
