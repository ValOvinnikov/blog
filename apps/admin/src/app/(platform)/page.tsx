import { adminRoutes } from '@admin/utils/routes/routes';
import { redirect } from 'next/navigation';

export default function PlatformIndexPage() {
  redirect(adminRoutes.tenants());
}
