import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { SIZE } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { Button } from '@shinefold/ui/components/atoms/button';
import { useTranslations } from 'next-intl';

import { lookSampleActionsVariants } from './look-sample-actions-variants';

export type TLookSampleActionsProps = Partial<IWithChildren>;

export const LookSampleActions = ({ children }: TLookSampleActionsProps) => {
  const t = useTranslations('lookPreview');

  return (
    <div className={lookSampleActionsVariants()}>
      <SamplePart part={SAMPLE_PART.BUTTON}>
        <Button type="button" size={SIZE.SM}>
          {t('subscribeButton')}
        </Button>
      </SamplePart>
      <SamplePart part={SAMPLE_PART.BUTTON}>
        <Button type="button" variant="ghost" size={SIZE.SM}>
          {t('readMoreButton')}
        </Button>
      </SamplePart>
      {children}
    </div>
  );
};
