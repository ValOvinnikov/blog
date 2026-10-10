import { TOAST_TYPE, type TToastType } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';

import type { IToastRecord } from './toast-record';
import { toastVariants } from './toast-variants';

type TToastProps = {
  record: IToastRecord;
  onDismiss: () => void;
};

const TOAST_GLYPH: Record<TToastType, string> = {
  [TOAST_TYPE.SUCCESS]: '✓',
  [TOAST_TYPE.INFO]: 'i',
  [TOAST_TYPE.WARNING]: '⚠',
  [TOAST_TYPE.ERROR]: '!',
};

const TOAST_ROLE: Record<TToastType, 'status' | 'alert'> = {
  [TOAST_TYPE.SUCCESS]: 'status',
  [TOAST_TYPE.INFO]: 'status',
  [TOAST_TYPE.WARNING]: 'status',
  [TOAST_TYPE.ERROR]: 'alert',
};

export const Toast = ({ record, onDismiss }: TToastProps) => {
  const { type, isLoading, title, message, time, action, phase } = record;
  const t = useTranslations('toast');
  const s = toastVariants({ type, phase });
  const dismissLabel = t('dismissLabel');

  return (
    <div role={TOAST_ROLE[type]} className={s.root()}>
      {isLoading ? (
        <span className={s.spinner()} aria-hidden="true" />
      ) : (
        <span className={s.glyph()} aria-hidden="true">
          {TOAST_GLYPH[type]}
        </span>
      )}
      <span className={s.message()}>
        {title && <strong className={s.titleText()}>{title}</strong>}
        {message}
      </span>
      {time && <span className={s.time()}>{time}</span>}
      {action && (
        <Button
          variant="unstyled"
          onClick={action.onAct}
          className={s.action()}
        >
          {action.label}
          {action.keyHint && (
            <span className={s.actionKey()}>{action.keyHint}</span>
          )}
        </Button>
      )}
      <Button
        variant="unstyled"
        onClick={onDismiss}
        aria-label={dismissLabel}
        title={dismissLabel}
        className={s.dismiss()}
      >
        ×
      </Button>
    </div>
  );
};
