import { ALERT_TYPE } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { PreviewModeGroup } from '@platform/components/shared/preview-mode-group';
import type { TPreviewMode } from '@platform/constants/preview';
import { useTranslations } from 'next-intl';

import { voiceNoteRowVariants } from './voice-note-row-variants';

export type TVoiceNoteRowProps = {
  selectedLocale: TLocaleIsoCode;
  isMultilingual: boolean;
  previewMode: TPreviewMode;
  onPreviewModeChange: (mode: TPreviewMode) => void;
};

export const VoiceNoteRow = ({
  selectedLocale,
  isMultilingual,
  previewMode,
  onPreviewModeChange,
}: TVoiceNoteRowProps) => {
  const t = useTranslations('voiceSettings');
  const tLanguage = useTranslations('languageNames');
  const tPreview = useTranslations('previewModeControl');
  const { root, note, languageEmphasis, previewSwitch, previewSwitchLabel } =
    voiceNoteRowVariants();

  return (
    <div className={root()}>
      <Alert
        type={ALERT_TYPE.INFO}
        role="note"
        className={note()}
        description={
          <>
            {t('fixedCopyNote')}
            {isMultilingual && (
              <>
                {' '}
                {t.rich('editingLanguageNote', {
                  language: tLanguage(selectedLocale),
                  strong: (chunks) => (
                    <strong className={languageEmphasis()}>{chunks}</strong>
                  ),
                })}
              </>
            )}
          </>
        }
      />
      <div className={previewSwitch()}>
        <span className={previewSwitchLabel()}>
          {tPreview('livePreviewHeading')}
        </span>
        <PreviewModeGroup value={previewMode} onChange={onPreviewModeChange} />
      </div>
    </div>
  );
};
