import type { IWithChildren } from '@blog/config/react';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Accordion } from '@platform/components/shared/accordion';
import { Text } from '@platform/components/shared/text';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookRow } from '@platform/constants/look-row';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';

import { lookCardVariants } from './look-card-variants';

export type TLookCardProps = IWithChildren & {
  card: TLookRow;
  title: string;
  description: string;
  summary: string;
  summaryMark?: ReactNode;
};

export const LookCard = ({
  card,
  title,
  description,
  summary,
  summaryMark,
  children,
}: TLookCardProps) => {
  const { hasCardChanges } = useLookForm();
  const t = useTranslations('saveBar');
  const titleId = useId();
  const { body, description: descriptionSlot } = lookCardVariants();

  return (
    <Accordion.Item value={card}>
      <Accordion.Trigger summary={summary} summaryMark={summaryMark}>
        <span id={titleId}>{title}</span>
        {hasCardChanges(card) && <UnsavedDot label={t('regionLabel')} />}
      </Accordion.Trigger>
      <Accordion.Panel>
        <div role="group" aria-labelledby={titleId} className={body()}>
          <Text variant="muted" className={descriptionSlot()}>
            {description}
          </Text>
          {children}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
