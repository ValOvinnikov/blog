'use client';

import type { IToastPayload } from '@web/context/toast-provider/toast-record';
import { reloadPage } from '@web/utils/reload-page/reload-page';
import { useTranslations } from 'next-intl';

const OUT_OF_DATE_NOTICE_KEY = 'out-of-date-notice';

export const useOutOfDateNotice = (): IToastPayload => {
  const t = useTranslations('outOfDateNotice');

  return {
    message: t('message'),
    action: { label: t('reloadLabel'), onAct: reloadPage },
    coalesceKey: OUT_OF_DATE_NOTICE_KEY,
  };
};
