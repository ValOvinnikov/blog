import { TOAST_TYPE, type TToastType } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon, STATUS_ICON } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';

import type { IToastRecord } from './toast-record';
import { toastVariants } from './toast-variants';

type TToastProps = {
  record: IToastRecord;
  onDismiss: () => void;
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
        <Icon
          name={STATUS_ICON[type]}
          size={ICON_SIZE.XS}
          className={s.icon()}
        />
      )}
      <span className={s.message()}>
        {title && <strong className={s.titleText()}>{title}</strong>}
        {message}
      </span>
      {time && <span className={s.time()}>{time}</span>}
      {action && (
        <Button
          variant={BUTTON_VARIANT.UNSTYLED}
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
        variant={BUTTON_VARIANT.UNSTYLED}
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
