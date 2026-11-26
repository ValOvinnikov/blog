'use client';

import { LocaleErrorPage } from '@web/components/pages/locale-error-page';
import type { TErrorPageProps } from '@web/components/shared/error-page-layout';

export default function Error(props: TErrorPageProps) {
  return <LocaleErrorPage {...props} />;
}
