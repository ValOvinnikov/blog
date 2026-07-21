import { NotFoundPage } from '@web/components/pages/not-found-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return <NotFoundPage />;
}
