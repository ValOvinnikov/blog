import { CheckMark } from '@platform/components/features/tenants/owner-home-view/components/get-started-card/components/check-mark/check-mark';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { checklistRowVariants } from './checklist-row-variants';

export type TChecklistRowProps = {
  title: string;
  isDone: boolean;
  isLocked?: boolean;
  description: string;
  actions?: ReactNode;
};

export const ChecklistRow = ({
  title,
  isDone,
  isLocked = false,
  description,
  actions,
}: TChecklistRowProps) => {
  const t = useTranslations('getStartedCard');
  const {
    root,
    body,
    title: titleSlot,
    state,
    description: descriptionSlot,
    actions: actionsSlot,
  } = checklistRowVariants({ isMuted: isDone || isLocked });

  return (
    <li className={root()}>
      <CheckMark isDone={isDone} />
      <div className={body()}>
        <span className={titleSlot()} aria-hidden="true">
          {title}
        </span>
        <span className={state()}>
          {t(isDone ? 'stepDone' : 'stepNotDone', { step: title })}
        </span>
        {!isDone && (
          <>
            <span className={descriptionSlot()}>{description}</span>
            {actions && <div className={actionsSlot()}>{actions}</div>}
          </>
        )}
      </div>
    </li>
  );
};
