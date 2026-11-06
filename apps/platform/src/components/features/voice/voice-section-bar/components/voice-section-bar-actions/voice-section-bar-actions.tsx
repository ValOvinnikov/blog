'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { ICONS, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { VOICE_SECTION_ID } from '@platform/constants/voice';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { VOICE_SECTIONS_IN_PAGE_ORDER } from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';

import { voiceSectionBarActionsVariants } from './voice-section-bar-actions-variants';

export type TVoiceSectionBarActionsProps = {
  hasTextButtons: boolean;
  isEverySectionOpen: boolean;
  onSetAllSectionsOpen: (isOpen: boolean) => void;
};

const SECTION_BODY_IDS = joinIds(
  ...VOICE_SECTIONS_IN_PAGE_ORDER.map(
    (section) => VOICE_SECTION_ID[section].body,
  ),
);

export const VoiceSectionBarActions = ({
  hasTextButtons,
  isEverySectionOpen,
  onSetAllSectionsOpen,
}: TVoiceSectionBarActionsProps) => {
  const t = useTranslations('voiceSettings');
  const { textButtons, divider, iconButton } = voiceSectionBarActionsVariants();

  if (hasTextButtons) {
    return (
      <div className={textButtons()}>
        <Button
          size={SIZE.XS}
          variant={BUTTON_VARIANT.SECONDARY}
          focusGround={FOCUS_RING_GROUND.SURFACE}
          aria-controls={SECTION_BODY_IDS}
          onClick={() => onSetAllSectionsOpen(true)}
        >
          {t('expandAll')}
        </Button>
        <Button
          size={SIZE.XS}
          variant={BUTTON_VARIANT.SECONDARY}
          focusGround={FOCUS_RING_GROUND.SURFACE}
          aria-controls={SECTION_BODY_IDS}
          onClick={() => onSetAllSectionsOpen(false)}
        >
          {t('collapseAll')}
        </Button>
      </div>
    );
  }

  const name = isEverySectionOpen
    ? t('collapseAllSections')
    : t('expandAllSections');

  return (
    <>
      <span aria-hidden="true" className={divider()} />
      <IconSoloControl
        ariaLabel={name}
        tooltip={name}
        icon={ICONS.UNFOLD}
        className={iconButton()}
        control={
          <BaseButton
            aria-controls={SECTION_BODY_IDS}
            onClick={() => onSetAllSectionsOpen(!isEverySectionOpen)}
          />
        }
      />
    </>
  );
};
