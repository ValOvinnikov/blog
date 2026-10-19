import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  redirect(await resolveHomeHref());
}
