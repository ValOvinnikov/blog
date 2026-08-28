import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

export default function OperatorIndexPage() {
  redirect(adminRoutes.tenants());
}
