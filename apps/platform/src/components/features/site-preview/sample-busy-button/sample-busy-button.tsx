import { type IBusyStyle, SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import {
  SAMPLE_BUSY_BUTTON_TEST_ID,
  SAMPLE_BUSY_STYLE_ATTRIBUTE,
  SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
} from '@platform/constants/sample-busy';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { useTranslations } from 'next-intl';

export type TSampleBusyButtonProps = {
  busy: IBusyStyle;
};

export const SampleBusyButton = ({
  busy: { busyStyle, spinnerVariant },
}: TSampleBusyButtonProps) => {
  const t = useTranslations('lookPreview');

  return (
    <div
      data-testid={SAMPLE_BUSY_BUTTON_TEST_ID}
      {...{
        [SAMPLE_BUSY_STYLE_ATTRIBUTE]: busyStyle,
        [SAMPLE_SPINNER_VARIANT_ATTRIBUTE]: spinnerVariant,
      }}
    >
      <SamplePart part={SAMPLE_PART.BUSY_BUTTON}>
        <Button
          type="button"
          size={SIZE.SM}
          isBusy={true}
          busyLabel={t('busyButtonLabel')}
          busyStyle={busyStyle}
          spinnerVariant={spinnerVariant}
        >
          {t('busyButtonIdle')}
        </Button>
      </SamplePart>
    </div>
  );
};
