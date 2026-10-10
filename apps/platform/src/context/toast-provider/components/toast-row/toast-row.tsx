'use client';

import { Toast, type IToastRecord } from '@platform/components/shared/toast';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react';

import { toastRowVariants } from './toast-row-variants';

type TToastRowProps = {
  record: IToastRecord;
  onEntered: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDismiss: (id: string) => void;
};

type TActivityKind = 'hover' | 'focus';

const s = toastRowVariants();

export const ToastRow = ({
  record,
  onEntered,
  onPause,
  onResume,
  onDismiss,
}: TToastRowProps) => {
  const { id, phase, count, message } = record;
  const t = useTranslations('toastProvider');
  const activity = useRef({ hover: false, focus: false });

  // Two frames, so the browser paints the off-screen start state before the transition runs.
  useEffect(() => {
    if (phase !== 'entering') return;

    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => onEntered(id));
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [id, phase, onEntered]);

  const setActivity = (kind: TActivityKind, isActive: boolean) => {
    const wasActive = activity.current.hover || activity.current.focus;
    activity.current = { ...activity.current, [kind]: isActive };
    const isNowActive = activity.current.hover || activity.current.focus;
    if (wasActive === isNowActive) return;

    if (isNowActive) {
      onPause(id);
    } else {
      onResume(id);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setActivity('focus', false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;

    event.stopPropagation();
    onDismiss(id);
  };

  const isMerged = count !== undefined && count > 1;
  const shownRecord =
    isMerged && typeof message === 'string'
      ? { ...record, message: `${message}${t('mergeCountSuffix', { count })}` }
      : record;

  return (
    <div
      className={s.row()}
      onMouseEnter={() => setActivity('hover', true)}
      onMouseLeave={() => setActivity('hover', false)}
      onFocus={() => setActivity('focus', true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <Toast record={shownRecord} onDismiss={() => onDismiss(id)} />
    </div>
  );
};
