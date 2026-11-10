import type { TVoiceFieldId, TVoicePortableText } from '@blog/config';
import { headingVariants } from '@blog/ui/components/atoms/heading/heading-variants';
import { Panel } from '@blog/ui/components/molecules/panel';
import { panelHeaderVariants } from '@blog/ui/components/molecules/panel/components/header/panel-header-variants';
import { panelVariants } from '@blog/ui/components/molecules/panel/panel-variants';
import { BookmarksList } from '@blog/ui/components/organisms/bookmarks-list';
import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';

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
      <p className={headingVariants({ visual: 'page' })}>{pageTitle}</p>
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
