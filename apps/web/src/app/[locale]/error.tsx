'use client';

import { LocaleErrorPage } from '@web/components/pages/locale-error-page';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <LocaleErrorPage {...props} />;
}
