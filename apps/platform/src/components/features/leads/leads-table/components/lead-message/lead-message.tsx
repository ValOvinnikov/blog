'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { leadMessageVariants } from './lead-message-variants';
import { useIsClipped } from './use-is-clipped';

export type TLeadMessageProps = {
  message: string;
};

export const LeadMessage = ({ message }: TLeadMessageProps) => {
  const t = useTranslations('leadMessage');
  const messageId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const { ref, isClipped } = useIsClipped<HTMLParagraphElement>();
  const { root, text } = leadMessageVariants({ isExpanded });

  return (
    <div className={root()}>
      <Text ref={ref} id={messageId} className={text()}>
        {message}
      </Text>
      {(isExpanded || isClipped) && (
        <Button
          size={SIZE.SM}
          aria-expanded={isExpanded}
          aria-controls={messageId}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? t('showLess') : t('showMore')}
        </Button>
      )}
    </div>
  );
};
