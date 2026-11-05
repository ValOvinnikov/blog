import type { IWithChildren } from '@blog/config/react';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Accordion } from '@platform/components/shared/accordion';
import { Text } from '@platform/components/shared/text';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookRow } from '@platform/constants/look-row';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';

import { lookCardVariants } from './look-card-variants';

export type TLookCardProps = IWithChildren & {
  card: TLookRow;
  description: string;
  summary: string;
  summaryMark?: ReactNode;
};

export const LookCard = ({
  card,
  description,
  summary,
  summaryMark,
  children,
}: TLookCardProps) => {
  const { hasCardChanges } = useLookForm();
  const t = useTranslations('lookForm');
  const tSaveBar = useTranslations('saveBar');
  const titleId = useId();
  const { item, body, description: descriptionSlot } = lookCardVariants();

  return (
    <Accordion.Item value={card} id={toLookAnchorId(card)} className={item()}>
      <Accordion.Trigger summary={summary} summaryMark={summaryMark}>
        <span id={titleId}>{t(LOOK_ROW_TITLE_KEY[card])}</span>
        {hasCardChanges(card) && <UnsavedDot label={tSaveBar('regionLabel')} />}
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
