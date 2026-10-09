import { SIZE, type TPresetId } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { Button } from '@platform/components/shared/button';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { useTranslations } from 'next-intl';

export type TPresetCardProps = {
  preset: TPresetId;
  onPresetChange: (preset: TPresetId) => void;
  onReset: () => void;
  isResetVisible: boolean;
  hasUnsavedChanges: boolean;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const PresetCard = ({
  preset,
  onPresetChange,
  onReset,
  isResetVisible,
  hasUnsavedChanges,
  isArchived,
  archivedNoticeId,
}: TPresetCardProps) => {
  const t = useTranslations('lookForm');
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;

  return (
    <LookCard
      title={t('presetLabel')}
      description={t('presetDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
      actions={
        isResetVisible && (
          <Button
            type="button"
            variant="secondary"
            size={SIZE.SM}
            onClick={onReset}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
          >
            {t('resetButton')}
          </Button>
        )
      }
    >
      <PresetPicker
        value={preset}
        onChange={onPresetChange}
        isDisabled={isArchived}
        aria-describedby={archivedDescribedBy}
      />
    </LookCard>
  );
};
