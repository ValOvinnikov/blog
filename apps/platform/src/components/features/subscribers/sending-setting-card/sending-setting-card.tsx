'use client';

import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import { Switch } from '@platform/components/shared/switch';
import { ALERT_TYPE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { sendingSettingCardVariants } from './sending-setting-card-variants';
import { useSendingSetting } from './use-sending-setting';

export type TSendingSettingCardProps = {
  tenantId: string;
  isInitiallyOn: boolean;
};

export const SendingSettingCard = ({
  tenantId,
  isInitiallyOn,
}: TSendingSettingCardProps) => {
  const t = useTranslations('subscribersPage.sending');
  const { isOn, hasFailed, isSaving, change } = useSendingSetting(
    tenantId,
    isInitiallyOn,
  );
  const { body, offNote } = sendingSettingCardVariants();
  const label = t('label');

  return (
    <Card>
      <Card.Body className={body()}>
        {hasFailed && <Alert type={ALERT_TYPE.ERROR} title={t('saveFailed')} />}
        <SettingRow label={label} description={t('description')}>
          <Switch
            aria={{ label }}
            isChecked={isOn}
            onCheckedChange={change}
            isDisabled={isSaving}
            labels={{ on: t('on'), off: t('off') }}
          />
        </SettingRow>
        {!isOn && <p className={offNote()}>{t('offNote')}</p>}
      </Card.Body>
    </Card>
  );
};
