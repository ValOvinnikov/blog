import type { TControlAria } from '@blog/config';
import { SettingRow } from '@platform/components/shared/setting-row';
import { Switch } from '@platform/components/shared/switch';
import { useTranslations } from 'next-intl';

export type TLanguageToggleRowProps = {
  aria: TControlAria & { label: string };
  description?: string;
  isChecked: boolean;
  isLocked: boolean;
  lockedReason?: string;
  isDisabled: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const LanguageToggleRow = ({
  aria,
  description,
  isChecked,
  isLocked,
  lockedReason,
  isDisabled,
  onCheckedChange,
}: TLanguageToggleRowProps) => {
  const t = useTranslations('languagesSettings');

  return (
    <SettingRow
      label={aria.label}
      description={description}
      isLocked={isLocked}
      lockedReason={lockedReason}
    >
      <Switch
        aria={aria}
        isChecked={isChecked}
        onCheckedChange={onCheckedChange}
        isDisabled={!isLocked && isDisabled}
        isLocked={isLocked}
        labels={{ on: t('switchOn'), off: t('switchOff') }}
      />
    </SettingRow>
  );
};
