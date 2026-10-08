import { StatusBadge } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';

import { voiceFieldStatusVariants } from './voice-field-status-variants';

export type TVoiceFieldStatusProps = {
  isCustomised: boolean;
  isUnsaved: boolean;
};

export const VoiceFieldStatus = ({
  isCustomised,
  isUnsaved,
}: TVoiceFieldStatusProps) => {
  const t = useTranslations('voiceSettings');
  const { root, unsavedDot, unsavedLabel } = voiceFieldStatusVariants();

  return (
    <span className={root()}>
      {isUnsaved && (
        <span data-testid="voice-field-unsaved">
          <span aria-hidden="true" className={unsavedDot()} />
          <span className={unsavedLabel()}>{t('unsaved')}</span>
        </span>
      )}
      <StatusBadge tone={isCustomised ? 'plan' : 'neutral'} hasDot={false}>
        {isCustomised ? t('badgeCustomised') : t('badgeDefault')}
      </StatusBadge>
    </span>
  );
};
