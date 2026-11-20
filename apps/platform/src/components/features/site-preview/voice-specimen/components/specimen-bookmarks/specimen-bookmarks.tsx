import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';
import {
  TEXT_ROLE,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';
import { Panel } from '@shinefold/ui/components/molecules/panel';
import { panelHeaderVariants } from '@shinefold/ui/components/molecules/panel/components/header/panel-header-variants';
import { panelVariants } from '@shinefold/ui/components/molecules/panel/panel-variants';
import { BookmarksList } from '@shinefold/ui/components/organisms/bookmarks-list';

import { specimenBookmarksVariants } from './specimen-bookmarks-variants';

export type TSpecimenBookmarksProps = {
  fieldId: TVoiceFieldId;
  value: string | TVoicePortableText;
  focusedFieldId?: TVoiceFieldId;
  pageTitle: string;
  listHeading: string;
};

export const SpecimenBookmarks = ({
  fieldId,
  value,
  focusedFieldId,
  pageTitle,
  listHeading,
}: TSpecimenBookmarksProps) => {
  const s = specimenBookmarksVariants();

  return (
    <div className={s.root()}>
      <Text textRole={TEXT_ROLE.PAGE_TITLE}>{pageTitle}</Text>
      <div className={panelVariants()}>
        <p className={panelHeaderVariants()}>{listHeading}</p>
        <Panel.Body>
          <BookmarksList
            rows={[]}
            emptyMessage={
              <VoiceKeyFrame
                fieldId={fieldId}
                isFocused={fieldId === focusedFieldId}
                isInline={true}
              >
                <VoiceRichText value={value} />
              </VoiceKeyFrame>
            }
          />
        </Panel.Body>
      </div>
    </div>
  );
};
