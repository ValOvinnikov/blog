'use client';

import { ErrorPage } from '@web/components/pages/error-page';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage {...props} />;
}
