import { adminRoutes } from '@admin/utils/routes/routes';
import { redirect } from 'next/navigation';

export default function OperatorIndexPage() {
  redirect(adminRoutes.tenants());
}
