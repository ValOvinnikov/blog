import { TenantsView } from '@admin/components/tenants-view';
import { queries } from '@blog/db';

export const metadata = { title: 'Tenants · Admin' };

export default async function TenantsPage() {
  const tenants = await queries.tenants.listTenants();

  return <TenantsView tenants={tenants} />;
}
